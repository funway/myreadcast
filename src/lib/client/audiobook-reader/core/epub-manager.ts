import Epub, { Book, Rendition, Location, NavItem } from 'epubjs';
import { EpubViewSettings, StateUpdater } from '../types';
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
      // (window as any).book = this.book;  // 挂载 book 对象到浏览器 window, 方便调试
      
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

  public attachTo(element: HTMLElement, settings: EpubViewSettings) {
    if (!this.book || !element) {
      console.error('Book not loaded or element not provided to attachTo.');
      return;
    }

    // 1. Render to HTML
    this.rendition = this.book.renderTo(element, {
      width: '100%',
      height: '100%',
      spread: 'auto',
      // manager: 'continuous',
      allowScriptedContent: true,
    });
    this.applySettings(settings);
    this.rendition.display();

    // 2. Listen to location changes to update page numbers
    this.rendition.on('relocated', (location: Location) => {
      const cfi = location.start.cfi;
      const percentage = this.book?.locations.percentageFromCfi(cfi) ?? 0;
      console.log("<EpubManager - epub.js> relocated:", location, cfi, percentage);
      this.updateState({ currentCfi: cfi });
    });

    // 3. Listen to rendered event to inject event handler into iframe
    interface IframeView {
      document: Document;
    }
    this.rendition.on("rendered", (section: Section, view: IframeView) => {
      console.log("<EpubManager - epub.js> rendered:", section, view);

      view.document.addEventListener('dblclick', function (event: MouseEvent) {
        console.log("<EpubManager> dbclick event in iframe");
        // event.preventDefault();
        const target = event.target as Node;
        const el = target.nodeType === 3
          ? (target.parentNode as HTMLElement)
          : (target as HTMLElement);

        console.log("双击文本:", el.textContent);
        console.log("元素 id:", el.id);
        console.log("当前文件:", section);
      });
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
    };

    const dynamicThemeName = 'current-settings';
    this.rendition.themes.register(dynamicThemeName, rules);
    this.rendition.themes.select(dynamicThemeName);
  }
}
