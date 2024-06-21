import { log } from "console";
import { ApiMsgEnum, IApiGameStartReq, IApiGameStartRes, IApiPlayerJoinReq, IApiPlayerJoinRes, IApiPlayerListReq, IApiPlayerListRes, IApiRoomCreateReq, IApiRoomCreateRes, IApiRoomJoinReq, IApiRoomLeaveReq, IApiRoomLeaveRes, IApiRoomListReq, IApiRoomListRes } from "./Common";
import { Connection, MyServer } from "./Core";
import { symlinkCommon } from "./Utils";
import { WebSocketServer } from "ws";
import { PlayerManager } from "./Biz/PlayerManager";
import { RoomManager } from "./Biz/RoomManager";
import { Room } from "./Biz/Room";

symlinkCommon();

//给Connection隐形添加playerId字段
declare module "./Core" {
    interface Connection {
        playerId: number;
    }
}

const server = new MyServer({
    port: 9876
})

server.on("connection", () => {
    console.log("wo lai le !", server.connections.size);
})
server.on("disconnection", (connection: Connection) => {
    console.log("mo zou le !", server.connections.size);
    if (connection.playerId) {
        PlayerManager.Instance.removePlayer(connection.playerId);
    }
    PlayerManager.Instance.syncPlayers();   //同步玩家列表
    console.log("PlayerManager.Instance.palyers.size", PlayerManager.Instance.players.size);
})

server.setApi(ApiMsgEnum.ApiPlayerJoin, (connection: Connection, data: IApiPlayerJoinReq): IApiPlayerJoinRes => {
    // return data+"我是服务端，我知道了";
    const { nickname } = data;
    const player = PlayerManager.Instance.createPlayer({ nickname, connection });
    connection.playerId = player.id;
    PlayerManager.Instance.syncPlayers();   //同步玩家列表
    return { player: PlayerManager.Instance.getPlayerView(player) };
})

//这个函数只需要返回所有player的视图层
server.setApi(ApiMsgEnum.ApiPlayerList, (connection: Connection, data: IApiPlayerListReq): IApiPlayerListRes => {
    return { list: PlayerManager.Instance.getplayersView(), };
})

server.setApi(ApiMsgEnum.ApiRoomList, (connection: Connection, data: IApiRoomListReq): IApiRoomListRes => {
    return { list: RoomManager.Instance.getRoomsView(), };
})

//
server.setApi(ApiMsgEnum.ApiRoomCreate, (connection: Connection, data: IApiRoomCreateReq): IApiRoomCreateRes => {
    if (connection.playerId) {
        const newRoom = RoomManager.Instance.createRoom();
        const room = RoomManager.Instance.joinRoom(newRoom.id, connection.playerId);
        if (room) {
            PlayerManager.Instance.syncPlayers();   //玩家直接也同步,此处在上面的Api已经调用过了
            RoomManager.Instance.syncRooms();   //把房间信息同步给所有玩家
            return {
                room: RoomManager.Instance.getRoomView(room),
            }
        } else {
            //异常最后会在Connection中调用
            throw new Error("房间不存在");
        }
    } else {
        //异常最后会在Connection中调用
        throw new Error("未登录");
    }
})

server.setApi(ApiMsgEnum.ApiRoomJoin, (connection: Connection, {rid}: IApiRoomJoinReq): IApiRoomCreateRes => {
    if (connection.playerId) {
        const room = RoomManager.Instance.joinRoom(rid, connection.playerId);
        if (room) {
            PlayerManager.Instance.syncPlayers();   //玩家直接也同步,此处在上面的Api已经调用过了
            RoomManager.Instance.syncRooms();   //把房间信息同步给所有玩家
            RoomManager.Instance.syncRoom(room.id);   //把进入房间后信息同步给所有玩家
            return {
                room: RoomManager.Instance.getRoomView(room),
            }
        } else {
            //异常最后会在Connection中调用
            throw new Error("房间不存在");
        }
    } else {
        //异常最后会在Connection中调用
        throw new Error("未登录");
    }
})

server.setApi(ApiMsgEnum.ApiRoomLeave, (connection: Connection, data: IApiRoomLeaveReq): IApiRoomLeaveRes => {
    if (connection.playerId) {
        const player = PlayerManager.Instance.idMapPlayer.get(connection.playerId);
        if(!player)throw new Error("玩家不存在");
        if(!player.rid)throw new Error("玩家不在房间");
        const rid = player.rid;
        RoomManager.Instance.leaveRoom(rid,player.id);
        PlayerManager.Instance.syncPlayers();   //玩家直接也同步,此处在上面的Api已经调用过了
        RoomManager.Instance.syncRooms();   //把房间信息同步给所有玩家
        RoomManager.Instance.syncRoom(rid);   //把进入房间后信息同步给所有玩家
        return {};
    } else {
        //异常最后会在Connection中调用
        throw new Error("未登录");
    }
})

server.setApi(ApiMsgEnum.ApiGameStart, (connection: Connection, data: IApiGameStartReq): IApiGameStartRes => {
    if (connection.playerId) {
        const player = PlayerManager.Instance.idMapPlayer.get(connection.playerId);
        if(!player)throw new Error("玩家不存在");
        if(!player.rid)throw new Error("玩家不在房间");
        const rid = player.rid;
        RoomManager.Instance.startRoom(rid);
        PlayerManager.Instance.syncPlayers();   //玩家直接也同步,此处在上面的Api已经调用过了
        RoomManager.Instance.syncRooms();   //把房间信息同步给所有玩家
        RoomManager.Instance.syncRoom(rid);   //把进入房间后信息同步给所有玩家
        return {};
    } else {
        //异常最后会在Connection中调用
        throw new Error("未登录");
    }
})



server
    .start()
    .then(() => {
        console.log("服务启动！！！！");
    }).catch((e) => {
        console.log(e);
    })


//帧同步的代码。、。
// const wss = new WebSocketServer({ port: 9876 });

// let inputs = [];

// wss.on("connection", (socket) => {
//     socket.on("message", (buffer) => {
//         const str = buffer.toString();
//         try {
//             const msg = JSON.parse(str);
//             const { name, data } = msg;
//             const {frameId,input} = data;
//             inputs.push(input);
//         } catch (e) {
//             console.log(e);
//         }
//     })

//     setInterval(() => {
//         const temp = inputs;
//         inputs = [];
//         const msg = {
//             name: ApiMsgEnum.MsgServerSync,
//             data: {
//                 inputs:temp,
//             }
//         }   //测试代码
//         socket.send(JSON.stringify(msg));
//     },100)

//     // const obj = {
//     //     name: "haha",
//     //     data: "haha123",
//     // }   //测试代码
//     // socket.send(JSON.stringify(obj));
// })

// wss.on("listening", () => {
//     console.log("Server is listening on port 9876,服务启动!!");
// })