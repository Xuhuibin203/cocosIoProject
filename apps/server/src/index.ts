import { log } from "console";
import { ApiMsgEnum } from "./Common";
import { Connection, MyServer } from "./Core";
import { symlinkCommon } from "./Utils";
import { WebSocketServer } from "ws";
import { PlayerManager } from "./Biz/PlayerManager";

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
    console.log("PlayerManager.Instance.palyers.size", PlayerManager.Instance.palyers.size);
})

server.setApi(ApiMsgEnum.ApiPlayerJoin, (connection: Connection, data: any) => {
    // return data+"我是服务端，我知道了";
    const { nickname } = data;
    const player = PlayerManager.Instance.createPlayer({ nickname, connection });
    connection.playerId = player.id;
    return { player: PlayerManager.Instance.getPlayerView(player) };
})

server
    .start()
    .then(() => {
        console.log("服务启动！！！！");
    }).catch((e) => {
        console.log(e);
    })

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