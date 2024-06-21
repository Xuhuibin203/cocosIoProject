import { IPlayer, IRoom } from "./Api";
import { IClienInput, IState } from "./State";

export interface IMsgClientSync {
    input: IClienInput,
    frameId: number,
}

export interface IMsgServerSync {
    inputs: IClienInput[],
    lastFrameId: number,
}

export interface IMsgPlayerList {
    list:IPlayer[],
}

export interface IMsgRoomList {
    list:IRoom[],
}
export interface IMsgRoom {
    room:IRoom,
}
export interface IMsgGameStart {
    state:IState,
}