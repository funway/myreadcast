/**
 * TypeScript type extensions for Epub.js
 * The original type definitions are incomplete 😮‍💨...
 */

/**
 * Usage of Epub.js
 * 
 * 1. Get current rendering views (iframes)
 * ✅ book.rendition.views()  // 返回当前渲染的 iframe 列表
 * ❌ book.rendition.getContents()  // 返回的是未渲染的 documents
 * 
 * 2. Jump to specific chapter/page/anchor/cfi
 * book.rendition.display()
 * book.rendition.display("Text/Chapter%201.xhtml#ae00293");
 * book.rendition.display("epubcfi(/6/10!/4/2/102/2/2[ae00293],/1:0,/1:5)");
 * 
 * 3. Assign CSS to a specific element in a view
 * book.rendition.views().get(0).document.getElementById("ae00293").classList.add("smil-highlight");
 * book.rendition.views().get(0).document.getElementById("ae00293").classList.remove("smil-highlight");
 * 
 * 4. Relation between chapter's xhtml and rendered iframe
 * - Section 对象代表每个 xhtml 的原始内容
 * - View 对象代表每个被渲染出来的 iframe
 * - view.section 指向该 iframe 的原始 section 对象
 * - views 列表挂载在 book.rendition 下面 (book.rendition.manager.views)
 * - sections 列表挂载在 book.spine 下面 (book.spine.spineItems)
 */


import 'epubjs';
import Container from "epubjs/types/container";
import View from "epubjs/types/managers/view";
import Section from "epubjs/types/section";

declare module "epubjs" {
  /** 增加 IframeView 类型 */ 
  interface IframeView extends View {
    document: Document;
  }

  /** 增加 Views 类型 */
  interface Views {
    container: Container;
    _views: IframeView[];
    length: number;
    hidden: boolean;
    
    first(): IframeView | undefined;
    last(): IframeView | undefined;
    indexOf(view: IframeView): number;
    slice(...args: any[]): IframeView[];
    get(i: number): IframeView | undefined;
    find(section: Section): IframeView | undefined;
    displayed(): IframeView[];
  }

  /** 修改 Rendition.views() 的返回类型 */
  interface Rendition {
    views(): Views;
  }
}
