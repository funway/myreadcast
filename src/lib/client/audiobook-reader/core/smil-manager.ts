import { SmilPar, StateUpdater } from "../types";

export class SmilManager { 
  private updateState: StateUpdater;
  private smilPars: SmilPar[] = [];
  
  // 索引优化: textSrc + textId -> SmilPar
  private textIndex = new Map<string, SmilPar>();

  // 索引优化: audioSrc -> SmilPar[]
  private audioIndex = new Map<string, SmilPar[]>();
  
  constructor(updateState: StateUpdater) {
    this.updateState = updateState;
  }

  public async load(smilPath: string) { 
    console.log("<SmilManager.load> Loading SMIL from:", smilPath);
    try {
      this.destroy();
      const resp = await fetch(smilPath);
      const data: SmilPar[] = await resp.json();
      this.smilPars = data;
      console.log('<SmilManager.load> SMIL pars:', data);
      this.buildIndexes();
    } catch (error) {
      console.error('<SmilManager.load> Failed to load SMIL pars:', error);
      throw error;
    }
  }

  private buildIndexes(): void { 
    this.textIndex.clear();
    this.audioIndex.clear();

    this.smilPars.forEach(par => { 
      // 构建文本索引
      const textKey = `${par.textSrc}#${par.textId}`;
      this.textIndex.set(textKey, par);

      // 构建音频索引
      if (!this.audioIndex.has(par.audioSrc)) {
        this.audioIndex.set(par.audioSrc, []);
      }
      this.audioIndex.get(par.audioSrc)!.push(par);
    });

    // 对每个音频文件的 SMILPar 按 clipBegin 排序 (其实本来就应该有序的了)
    this.audioIndex.forEach(pars => {
      pars.sort((a, b) => a.clipBegin - b.clipBegin);
    });
  }

  public findByText(
    textSrc: string,
    textId: string,
  ) {
    const textKey = `${textSrc}#${textId}`;
    console.log(`<SmilManager> Find smil by text: ${textKey}`);
    return this.textIndex.get(textKey) ?? null;
  }

  public findByAudioTime(
    audioSrc: string,
    audioTime: number
  ) {
    const pars = this.audioIndex.get(audioSrc);
    if (!pars || pars.length === 0) {
      return null;
    }

    // Binary search
    let result: SmilPar | null = null;
    let left = 0;
    let right = pars.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const par = pars[mid];

      if (par.clipBegin <= audioTime && audioTime <= par.clipEnd) {
        return par;
      } else if (par.clipBegin <= audioTime) {
        result = par;   // 保证如果 audioTime 落在两个 clips 的间隙之间时候，也能返回左边的 clip 而不是 null
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  public destroy() { 
    this.smilPars = [];
    this.textIndex.clear();
    this.audioIndex.clear();
  }
}