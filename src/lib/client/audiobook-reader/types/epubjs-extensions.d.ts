/**
 * TypeScript type extensions for Epub.js
 * 😮‍💨 Epub.js 实在太拉了。。。 
 * - 首先是 ts 类型导出不完整！
 * - 然后是太多全局事件回调没有清理导致内存泄漏！
 *  我现在查到的就有两个: getEventListeners(window) ==> 
 *    orientationchange 事件, unload 事件都绑定了 ViewManager 对象, resize 事件倒是清理干净了。。。
 *    这就会导致，即使调用了 Book.destroy(). 但是 Book 包含 Rendition, Rendition 包含 ViewManager, 
 *    结果 ViewManager 被全局 window 保持在事件的回调闭包中，导致大家都无法被销毁。。。
 *  所以，我们需要给两个类打补丁:
 *    DefaultViewManager 类的 addEventListeners() 方法和 removeEventListeners() 方法
 *    Stage 类的 destroy() 方法
 *  
 * 我把我们打补丁的版本上传到了 https://www.npmjs.com/package/hawu-epubjs
 * 本文件只用来做类型声明的补充
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
 * 
 * 5. 跨页问题
 * 假设我们有一个标签 id 是 ae00310, 
 * 我们可以使用 rendition.display("Text/Chapter%201.xhtml#ae00310") 跳转到该标签的位置。
 * 但是如果该标签包含长文本，又正好跨页了。
 * 那么使用 href 的形式跳转，只能在当前渲染的 view 右下角显示该 text 的前半部分，后半部分在下一页无法自动跳转。
 * 这时候就需要使用 rendition.display(cfi) 的形式.
 * 1. 先通过 section.cfiFromElement(sec.document.getElementById("ae00310")); 获取该标签元素的 cfi
 *    得到 'epubcfi(/6/10!/4/2/108/2/6[ae00310])'
 * 2. 假设该标签内共有 60 个字符, 后 20 个字符被渲染在下一页
 *    根据 cfi 规则
 *    epubcfi(/6/10!/4/2/108/2/6[ae00310]/1:45) 后面加上 /1 表示取该元素内部文本, :45 表示第45个字符
 * 3. 通过 rendition.display('epubcfi(/6/10!/4/2/108/2/6[ae00310]/1:45)') 就能跳转到显示第45个字符的页面了。
 */


import 'hawu-epubjs';
import Section from 'hawu-epubjs/types/section';

/**
 * ===== 增强类型声明 =====
 */
declare module "hawu-epubjs" {
  /** 修改 View 类型声明 */
  interface View {
    document: Document;
    window: Window;
    section: Section;
  }
  /**
   * View 派生了两个类: IframeView 和 InlineView
   * 对于 IframeView 来说，它的 document 和 window 就是指 iframe 自己的，与主文档的 document, window 不同.
   * 对于 InlineView 来说，它的 document 和 window 就是主文档的 document 和 window. 它没有用 iframe.
   * 但实际上, epub.js v0.3.93 只用到了 IframeView, 并没有使用 InlineView!
   */

  /** 增加 Views 类型声明 */
  interface Views {
    container: Container;
    _views: View[];
    length: number;
    hidden: boolean;
    
    all(): View[];
    displayed(): View[];
    indexOf(view: View): number;
    get(i: number): View | undefined;
    find(section: Section): View | undefined;
  }

  /** 修改 Rendition.views() 的返回类型 */
  interface Rendition {
    views(): Views;
  }
}
