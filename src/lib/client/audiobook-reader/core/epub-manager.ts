import Epub, { Book, Rendition, Location, NavItem, IframeView, Contents } from 'epubjs';
import { EpubViewSettings, StateUpdater, EpubEventListener } from '../types';
import { getAppColors } from '../utils';
import Section from 'epubjs/types/section';
    
export class EpubManager {
  private updateState: StateUpdater;

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

  constructor(updateState: StateUpdater) {
    this.updateState = updateState;
  }

  public async load(url: string) {
    try {
      this.destroy(); // Clean up previous book instance
      this.book = Epub(url);
      console.log('<EpubManager.load> Loading EPUB from:', url);
      
      await this.book.ready;
      console.log('<EpubManager.load> EPUB book loaded successfully.');
      if (process.env.NODE_ENV === 'development') {
        (window as any).book = this.book;  // 挂载 book 对象到浏览器 window, 方便调试
      }
      
      const N = 512;
      this.book.locations.generate(N).then(() => { 
        console.log('<EpubManager.load> EPUB locations generated', this.book!.locations);
        this.locationsReady = true;
        // Locations 对象不能直接被 JSON stringify，所以不能保存到 ReaderState 中
      });
      
      this.updateState({ toc: this.getToc() });
    } catch (error) {
      console.error('<EpubManager.load> Error loading EPUB:', error);
      this.updateState({ error: { message: 'Failed to load book.' } });
    }
  }

  public attachTo(
    element: HTMLElement,
    settings: EpubViewSettings,
    eventListeners?: EpubEventListener[])
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
      // manager: 'default',  // default 一次只显示一个章节 | continuous 连续章节
      flow: 'paginated',  // paginated 左右分页阅读 | scrolled-doc 上下滚动阅读 | auto 根据 opf 文件中定义, 默认左右分页
      allowScriptedContent: true,
    });
    this.applySettings(settings);
    this.rendition.display();

    // 2. Listen to location changes to update page numbers (翻页事件)
    this.rendition.on('relocated', (location: Location) => {
      const href = location.start.href;
      const cfi = location.start.cfi;
      const percentage = this.book?.locations.percentageFromCfi(cfi) ?? 0;
      console.log(`<EpubManager - epub.js> relocated: ${href}, ${cfi}, ${percentage}%`, location);

      this.updateState({ currentCfi: cfi });
    });

    // 3. Listen to rendered event to inject event handler into iframe (iframe 载入事件)
    this.rendition.on('rendered', (section: Section, view: IframeView) => {
      console.log("<EpubManager - epub.js> rendered:", section, view);

      view.document.addEventListener('dblclick', function (event: MouseEvent) {
        console.log("<EpubManager - iframe> dbclick event in iframe.", event.target,
          " section:", section,
          " view:", view
        );
        // event.preventDefault();
        // const target = event.target as Node;
        // const el = target.nodeType === 3
        //   ? (target.parentNode as HTMLElement)
        //   : (target as HTMLElement);
        // console.log("双击文本:", el.textContent);
        // console.log("元素 id:", el.id);

      });
      
      // 注入自定义事件监听器
      if (eventListeners && eventListeners.length > 0) {
        eventListeners.forEach(({ eventType, eventHandler }) => {
          view.document.addEventListener(eventType, (e) => {
            eventHandler(e, section, view);
          });
        });
      }

    });

    // 4. iframe 内文字选中事件
    this.rendition.on('selected', (cfiRange: string, contents: Contents) => {
      console.log("<EpubManager - epub.js> selected:", cfiRange, contents);
    });
  }

  public detach() {
    // This could be expanded to hide the rendition without destroying it
    this.rendition?.destroy();
    this.rendition = null;
  }

  public destroy() {
    if (this.book) {
      this.book.destroy();
    }
    this.book = null;
    this.rendition = null;
    this.locationsReady = false;
  }

  public getToc(): NavItem[] {
    return this.book?.navigation.toc || [];
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

  public getCurrentLocation() {
    return this.rendition?.currentLocation();
  }

  public hightlightText(textSrc: string, textId: string) { 
    console.log(`<EpubManager.hightlightText> ${textSrc}#${textId}`);
    if (!this.rendition || !this.book) {
      console.warn('<EpubManager.hightlightText> rendition or book not ready');
      return;
    }

    const views = this.rendition.views();

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
