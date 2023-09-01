import { Interface, createInterface } from "readline";
import { GlobalEvent, GlobalVar } from "./RunTime/Global";
import { ConsoleCmd } from "./TMBotCommand";

// let log_ = MainLogger;

//逃避tsc编译bug
declare namespace mc {
    export function listen(a: "onConsoleCmd", b: (c: string) => void): boolean;
    export function runcmd(str: string): boolean;
};

let READLINE_INST: Interface;

export function onReadLineInit() {
    if (typeof (LL) != "undefined") {
        let Stopping = false;
        mc.listen("onConsoleCmd", (cmd) => {
            if (Stopping) {
                if (cmd == "stop") { return false; }
                return true;
            }
            if (cmd.trim() == "stop") {
                Stopping = true;
                (async () => {
                    await GlobalVar.TMBotStop();
                    mc.runcmd("stop");
                })();
                return false;
            }
            return true;
        });
        return;
    }
    let readline = createInterface({
        "input": process.stdin,
        "output": process.stdout
    });
    READLINE_INST = readline;
    let Stopping = false;
    readline.on("SIGINT", async function () {
        if (Stopping) {
            GlobalVar.TMBotStop();
            return;
        }
        GlobalVar.MainLogger.warn("再按一次退出程序!");
        Stopping = true;
        setTimeout(() => { Stopping = false; }, 3000);
    });
    GlobalEvent.onTMBotStop.on(function CloseReadline() {
        readline.close();
    });
    readline.on("line", (input) => {
        ConsoleCmd.CmdSystem._execute(input || "", ConsoleCmd.CmdRunner, ConsoleCmd.CmdOutput, false);
    });
}

export function $$_GET_READLINE_INSTANCE_() {
    return READLINE_INST;
}