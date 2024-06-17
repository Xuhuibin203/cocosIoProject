import { _decorator, Component, director, EditBox, Node } from 'cc';
import { NetworkManager } from '../Global/NetworkManager';
import { ApiMsgEnum } from '../Common';
import DataManager from '../Global/DataManager';
import { SceneEnum } from '../Enum';
const { ccclass, property } = _decorator;

@ccclass('LoginManager')
export class LoginManager extends Component {
    input: EditBox;
    onLoad() {
        this.input = this.getComponentInChildren(EditBox);
        director.preloadScene(SceneEnum.Battle);    //场景预加载 
    }

    async start() {
        await NetworkManager.Instance.connect();
    }

    async handleClick() {
        if (!NetworkManager.Instance.isConnected) {
            console.log("未连接！！from LoginManager");
            await NetworkManager.Instance.connect();
            return;
        }
        const nickname = this.input.string;
        if (!nickname) {  //需要输入昵称
            console.log("nickname没有");
            return;
        }

        //调用API 
        const { success, error, res } = await NetworkManager.Instance.callApi(ApiMsgEnum.ApiPlayerJoin, { nickname });
        if (!success) {
            console.log(error);
            return;
        }
        DataManager.Instance.myPlayerId = res.player.id;
        console.log("res!", res);

        //登录成功后进行跳转
        director.loadScene(SceneEnum.Battle);
    }

}

