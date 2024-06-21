export enum InputTypeEnum{
    ActorMove = "ActorMove",
    WeaponShoot = "WeaponShoot",
    TimePast = "TimePast",
}

export enum EntityTypeEnum {
    Map = "Map",
    Actor1 = "Actor1",
    Weapon1 = "Weapon1",
    Bullet1 = "Bullet1",
    Bullet2 = "Bullet2",
    Explosion = "Explosion",
}

export enum ApiMsgEnum{
    ApiPlayerJoin = "ApiPlayerJoin",
    ApiPlayerList = "ApiPlayerList",
    ApiRoomCreate = "ApiRoomCreate",
    ApiRoomLeave = "ApiRoomLeave",
    ApiGameStart = "ApiGameStart",
    ApiRoomJoin = "ApiRoomJoin",
    ApiRoomList = "ApiRoomList", 
    MsgClientSync = "MsgClientSync",
    MsgServerSync = "MsgServerSync",
    MsgPlayerList = "MsgPlayerList",
    MsgRoomList = "MsgRoomList",
    MsgGameStart = "MsgGameStart",  //
    MsgRoom = "MsgRoom",    //房间内消息的同步
}

