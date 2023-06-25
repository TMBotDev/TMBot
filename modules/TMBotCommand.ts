import { TMBotCmd } from "./CommandSystem";
import { GlobalVar } from "./Global";




let cmdSystem = new TMBotCmd.TMBotCommandSystem("TMBot");

class TMBotCmdPerm extends TMBotCmd.TMBotCommandPerm<TMBotCmdPerm> {
    constructor(private _isEligible: (perm: TMBotCmdPerm) => boolean) {
        super();
    }
    isEligible(perm: TMBotCmdPerm): boolean {
        if (!(perm instanceof TMBotCmdPerm)) {
            return false;
        }
        return this._isEligible(perm);
    }
}

class TMBotCmdRunner extends TMBotCmd.TMBotCommandRunner<TMBotCmdPerm> { }

class TMBotCmdOutput extends TMBotCmd.TMBotCommandOutput {
    success(...args: any[]) {
        return GlobalVar.MainLogger.info(...args);
    }
    error(...args: any[]) {
        return GlobalVar.MainLogger.error(...args);
    }
}

//控制台权限
let CmdPerm = new TMBotCmdPerm((_) => true);

//控制台运行者
let CmdRunner = new TMBotCmdRunner(CmdPerm);//由于直接使用的同一个权限类,使用使用与需要权限相同的类

//控制台命令输出
let CmdOutput = new TMBotCmdOutput();

export let ConsoleCmd = {
    "CmdSystem": cmdSystem,
    "CmdPerm": CmdPerm,
    "CmdRunner": CmdRunner,
    "CmdOutput": CmdOutput
};

//help
let cmdHelper = new TMBotCmd.HelpCmdHelper(cmdSystem);
cmdHelper.update();
cmdHelper.setup();

cmdSystem.newCommand("version", "版本信息", CmdPerm)
    .overload([])!((cmd, _runner, out) => {//设置命令重载
        out.success(`TMBot版本: v${GlobalVar.Version.version.join(".")}${GlobalVar.Version.isBeta ? "(Beta)" : ""}`);
        let inLLSE = false;
        if (typeof (ll) != "undefined") {
            inLLSE = true;
        }
        out.success(`是否运行于LiteLoader-ScriptEngine: ${inLLSE}`);
        inLLSE && out.success(`LiteLoader版本: ${ll.versionString()}`);
        cmd.RunningCompleted();
    })
    .setup();//装载命令


let stopCmd = cmdSystem.newCommand("stop", "关闭TMBot", CmdPerm);

stopCmd.setAlias("exit");

stopCmd.overload([])!((cmd, runner, out) => {
    GlobalVar.TMBotStop();
    //都stop了还要啥解除占用啊
});
stopCmd.setup();
// stopCmd.setAlias(".exit");//test