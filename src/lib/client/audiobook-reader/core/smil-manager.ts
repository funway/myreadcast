import { StateUpdater } from "../types";

export class SmilManager { 
  private updateState: StateUpdater;
  
  constructor(updateState: StateUpdater) {
    this.updateState = updateState;
  }
}