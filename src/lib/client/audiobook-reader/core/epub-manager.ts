import { EpubViewSettings, ReaderEventEmitter, SmilPar, StateUpdater } from '../types';
import Epub, { Book, Rendition, Location, NavItem, View, Contents, EpubCFI } from 'hawu-epubjs';
import Section from 'hawu-epubjs/types/section';
import { getAppColors } from '../utils';
    
export class EpubManager {
  private updateState: StateUpdater;
  private emit: ReaderEventEmitter;

  /**
   * Book instance from Epub.js
   */
  private book: Book | null = null;
  
  /**
   * Rendition instance (EPUB render) from Epub.js
   */
  private rendition: Rendition | null = null;
  
  /**
   * epub.js 的 Locations 对象是否准备完毕 (异步加载，不等待)
   */
  private locationsReady: boolean = false;

  constructor(updateState: StateUpdater, emit: ReaderEventEmitter) {
    this.updateState = updateState;
    this.emit = emit;
  }

  public async load(url: string) {
    try {
      this.destroy();

      this.book = Epub(url);
      console.log('<EpubManager.load> Loading EPUB from:', url);
      
      await this.book.ready;
      console.log('<EpubManager.load> EPUB book loaded successfully.');

      if (process.env.NODE_ENV === 'development') {
        (window as Window & { book?: Book | null }).book = this.book;  // 挂载 book 对象到浏览器 window, 方便调试
      }
      
      const N = 512;
      this.book.locations.generate(N).then(() => {
        /**
         * 计算 locations 需要加载全部 EPUB spine 中的章节, 所以是一个耗时的异步过程
         * 在计算完成之前，locations.percentageFromCfi() 函数会返回 null
         * 
         * Locations 对象不能直接被 JSON stringify，所以不能保存到 ReaderState 中, 也就不好保存到数据库里
         * 所以我们暂时是每次都要重新计算 locations
         */
        
        this.locationsReady = true;
        // console.log('<EpubManager.load> EPUB locations generated', this.book!.locations);
      });
      
      this.updateState({ toc: this.getToc() });
    } catch (error) {
      console.error('<EpubManager.load> Error loading EPUB:', error);
      this.updateState({ error: { message: 'Failed to load book.' } });
    }
  }

  public async attachTo(element: HTMLElement, settings: EpubViewSettings)
  {
    if (!this.book || !element) {
      console.error('Book not loaded or element not provided to attachTo.');
      return;
    }

    // 1. Render to HTML
    this.rendition = this.book.renderTo(element, {
      width: '100%',
      height: '100%',
      spread: 'auto',
      // manager: 'continuous',  // default 一次只显示一个章节 | continuous 连续章节
      flow: 'paginated',  // paginated 左右分页阅读 | scrolled-doc 上下滚动阅读 | auto 根据 opf 文件中定义, 默认左右分页
      allowScriptedContent: true,
    });
    this.applySettings(settings);

    // 2. Listen to location changes to update page numbers (翻页事件, 其实是在每次调用 rendition.display() 后触发)
    this.rendition.on('relocated', (location: Location) => {
      const href = location.start.href;
      const cfi = location.start.cfi;
      const percentage = this.percentageFromCfi(cfi) ?? 0;
      console.log(`<EpubManager> epub.js, Rendition event, relocated: ${href}, ${cfi}, ${percentage}%`, location);

      this.updateState({ currentCfi: cfi });
    });

    // 3. Listen to rendered event to inject event handler into iframe (iframe 载入事件)
    this.rendition.on('rendered', (section: Section, view: View) => {
      console.log("<EpubManager> epub.js, Rendition evnet, rendered:", section, view);
      
      view.document!.addEventListener('dblclick', (event: MouseEvent) => {
        console.log("<EpubManager> epub.js, Rendition, View event, dbclick event in view.document.", event.target,
          " section:", section,
          " view:", view
        );
        
        // event.preventDefault();  这并不能阻止双击时候浏览器默认的文本选中事件

        const target = event.target as Node;
        const el = target.nodeType === 3
          ? (target.parentNode as HTMLElement)
          : (target as HTMLElement);
        const textSrc = section.href;
        const textId = el.id;  // 没有 id 则返回空字符串 
        console.log(`<EpubManager> dblclick on ${textSrc}#${textId}`);
        
        this.emit('epub-dblclick', { textSrc, textId });
      });
    });

    // 4. iframe 内文字选中事件
    this.rendition.on('selected', (cfiRange: string, contents: Contents) => {
      console.log("<EpubManager> epub.js, Rendition event, selected:", cfiRange, contents);
    });

    // 5. Display
    await this.rendition.display();
  }

  public detach() {
    // This could be expanded to hide the rendition without destroying it
    this.rendition?.destroy();
    this.rendition = null;
  }

  public destroy() {
    if (process.env.NODE_ENV === 'development') {
      (window as Window & { book?: Book | null }).book = null;
    }

    if (this.book) {
      this.book.destroy();  // book.destroy() 自行注销内部的 rendition, packaging, spine 等对象
    }
    this.rendition = null;
    this.book = null;
    this.locationsReady = false;
  }

  public getToc(): NavItem[] {
    return this.book?.navigation.toc || [];
  }

  /**
   * 返回当前显示页面的 rendered location range, 包括 { start, end }
   * @returns 
   */
  public getCurrentLocation() {
    return this.rendition?.location;
  }

  public getCfi(chapterSrc: string, tagId: string, offsetRatio: number = 0) {
    const section = this.book?.spine.get(chapterSrc);
    if (!section) {
      console.warn(`<EpubManager.getCfi> Section not found for chapterSrc: ${chapterSrc}`);
      return null;
    }

    if (!section.document) {
      console.warn(`<EpubManager.getCfi> Document of section ${chapterSrc} is not loaded`);
      return null;
    }
    
    const elem = section.document.getElementById(tagId);
    if (!elem) {
      console.warn(`<EpubManager.getCfi> Element with id ${tagId} not found in section: ${chapterSrc}`);
      return null;
    }
    const elemCfi = section.cfiFromElement(elem);
    console.log('<EpubManager.getCfi> The tag element cfi:', elemCfi);

    // 计算 elem 下面的全部字符数
    const totalLength = elem.textContent.length;
    // 计算目标字符的位置
    const target = Math.floor(offsetRatio * totalLength);

    /**
     * 遍历 elem.childNodes 中的 text node
     * 找到 target 所在的 node 的 index，以及相对于该 node 的offset
     */
    let accumulated = 0;
    let nodeIndex = -1;
    let nodeOffset = -1;

    for (let i = 0; i < elem.childNodes.length; i++) {
      const node = elem.childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length ?? 0;
        if (accumulated + textLength > target) {
          nodeIndex = i;
          nodeOffset = target - accumulated;
          break;
        }
        accumulated += textLength;
      }
    }
    console.log('<EpubManager.getCfi> Calculate target:', target, nodeIndex, nodeOffset);

    // Use section.cfiFromElement to get the base CFI, then use cfiFromRange if offset is needed
    if (nodeIndex !== -1 && nodeOffset !== -1) {
      const range = section.document.createRange();  // Create a empty range
      const textNode = elem.childNodes[nodeIndex];
      range.setStart(textNode, nodeOffset);          // Set range start position
      // range.setEnd(textNode, nodeOffset);         // We dont need end position here
      const cfiWithOffset = section.cfiFromRange(range);
      
      console.log('<EpubManager.getCfi> The cfi with chars offset:', cfiWithOffset);
      return cfiWithOffset;
    }
    return elemCfi;
  }

  /**
   * Calculate the reading progress percentage based on a given CFI (Canonical Fragment Identifier).
   *
   * This function uses the `locations` object from epub.js to compute the percentage.
   *
   * Notes:
   * - If `locations` are not yet generated (usually requiring asynchronous loading of all chapters),
   *   this function will return `null`.
   * - The return value is a decimal between 0 and 1, representing the reading progress.
   *
   * @param cfi - The CFI (Canonical Fragment Identifier) indicating a position in the EPUB.
   * @returns The reading progress as a number between 0 and 1, or `null` if locations are not ready.
   */
  public percentageFromCfi(cfi: string): number | null {
    return this.book!.locations.percentageFromCfi(cfi);
  }

  /**
   * 判断该 cfi 是否在当前视口
   * @param cfi 
   * @returns 
   */
  public cfiDisplaying(cfi: string): boolean {
    if (this.rendition) {
      const { start, end } = this.rendition.location;
      const afterLeft = this.rendition.epubcfi.compare(cfi, start.cfi);
      const beforeRight = this.rendition.epubcfi.compare(end.cfi, cfi);
      
      console.log('start, end, target:', start, end, cfi,
        'compare:', afterLeft, beforeRight);

      if (afterLeft >=0 && beforeRight >=0 ) {
        return true;
      }
    }
    return false;
  }

  public smilDisplaying(smilPar: SmilPar): boolean {
    const cfi = this.getCfi(smilPar.textSrc, smilPar.textId);
    
    if (cfi && this.cfiDisplaying(cfi)) return true;
    return false;
  }

  public async goToHref(href: string) {
    if (!this.rendition) {
      console.error('Rendition not available');
      return;
    }
    
    try {
      await this.rendition.display(href);
      // rendition.display("Text/Chapter%201.xhtml#ae00293");
    } catch (error) {
      console.error('Error navigating to TOC item:', error);
    }
  }

  public async goToCfi(cfi: string) {
    if (!this.rendition) {
      console.error('Rendition not available');
      return;
    }
    
    try {
      await this.rendition.display(cfi);
      // rendition.display("epubcfi(/6/10!/4/2/102/2/2[ae00293],/1:0,/1:5)");
    } catch (error) {
      console.error('Error navigating to CFI:', error);
    }
  }

  public nextPage() {
    this.rendition?.next();
  }

  public prevPage() {
    this.rendition?.prev();
  }

  public highlightText(textSrc: string, textId: string) { 
    console.log(`<EpubManager.highlightText> ${textSrc}#${textId}`);
    if (!this.rendition || !this.book) {
      console.warn('<EpubManager.highlightText> rendition or book not ready');
      return;
    }

    this.clearHighlight();

    const views = this.rendition.views().all();
    for (const view of views) {
      if (view.section.href === textSrc) {
        const doc = view.document;
        if (!doc) continue;
        
        const el = doc.getElementById(textId);
        if (el) {
          el.classList.add('smil-highlight');
        } else {
          console.warn(`<EpubManager.highlightText> Element with id ${textId} not found in ${textSrc}`);
        }
        break;
      }
    }
  }

  /**
   * 清除 rendition.views 中所有 .smil-highlight 的 CSS class
   */
  public clearHighlight() { 
    if (!this.rendition) return;
    const views = this.rendition.views().all();
    for (const view of views) {
      const doc = view.document;
      if (!doc) continue;
      const highlighted = doc.querySelectorAll('.smil-highlight');
      highlighted.forEach(el => el.classList.remove('smil-highlight'));
    }
  }

  public applySettings(settings: EpubViewSettings) {
    console.log('<EpubManager.applySettings>:', settings);
    if (!this.rendition) return;
    
    // const themeColors = themeColorMap[settings.theme] || themeColorMap.light;
    const themeColors = getAppColors();
    const rules = {
      '*': {
        'font-family': `${settings.fontFamily} !important`,
        'line-height': `${settings.lineHeight} !important`,
        'color': `${themeColors.color} !important`,
        'background-color': `transparent !important`,
      },
      'body': {
        'font-size': `${settings.fontSize}% !important`,
        'background': `${themeColors.background} !important`,
      },
      '.smil-highlight': {
        'background-color': 'rgba(255, 255, 0, 0.3) !important',
        'transition': 'background-color 0.3s ease !important',
        'box-shadow': '0 0 8px rgba(255, 255, 0, 0.4) !important',
      },
    };

    const dynamicThemeName = 'current-settings';
    this.rendition.themes.register(dynamicThemeName, rules);
    this.rendition.themes.select(dynamicThemeName);
  }
}
