import Epub, { Book, Rendition, Location, NavItem } from 'epubjs';
import { ReaderState } from '../types';

// A callback for when the manager needs to update the central state
type StateUpdater = (newState: Partial<ReaderState>) => void;

// // Font settings interface
// export interface FontSettings {
//   fontFamily?: string;
//   fontSize?: string;
//   lineHeight?: string;
// }

// // Theme options
// export type ThemeType = 'light' | 'dark' | 'sepia' | 'high-contrast';

// export interface ThemeConfig {
//   name: ThemeType;
//   backgroundColor: string;
//   textColor: string;
//   linkColor?: string;
// }


export class EpubManager {
  /**
   * Book instance from Epub.js
   */
  private book: Book | null = null;
  
  /**
   * Rendition instance (EPUB render) from Epub.js
   */
  private rendition: Rendition | null = null;

  /**
   * callback
   */
  private updateState: StateUpdater;

  constructor(updateState: StateUpdater) {
    this.updateState = updateState;
  }

  public async load(url: string) {
    try {
      this.destroy(); // Clean up previous book instance
      this.book = Epub(url);
      console.log('Loading EPUB from:', url);
      
      await this.book.ready;
      console.log('EPUB book loaded successfully.');
      
      const N = 512;
      await this.book.locations.generate(N);
      console.log('EPUB locations generated', this.book.locations);
    } catch (error) {
      console.error('Error loading EPUB:', error);
      this.updateState({ error: { message: 'Failed to load book.' } });
    }
  }

  public attachTo(element: HTMLElement) {
    if (!this.book || !element) {
      console.error('Book not loaded or element not provided to attachTo.');
      return;
    }

    this.rendition = this.book.renderTo(element, {
      width: '100%',
      height: '100%',
      spread: 'auto', // Use single or double page spread based on width
    });

    // this.applyFontSettings();
    // this.applyTheme(this.currentTheme);

    this.rendition.display();

    // Listen to location changes to update page numbers
    this.rendition.on('relocated', (location: Location) => {
      
      const cfi = location.start.cfi;
      const percentage = this.book?.locations.percentageFromCfi(cfi);
      // var displayPercentage = Math.floor(percentage * 100);
      console.log("[epub.js] relocated:", location, cfi, percentage);

      const currentPage = location.start.location;
      this.updateState({ currentPage });
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
  }

  public getToc(): NavItem[] {
    return this.book?.navigation.toc || [];
  }

  public async goToTocItem(href: string) {
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
}
