

export namespace CommandParams {
    /** 父 */
    export class Param<T> {
        /** (内部函数)参数是否是自己 */
        _paramIsThis(str: string): boolean { return true; }
        /** (内部函数)清除内容,如果不做处理会残留数据! */
        _clear(): void { }
        /** (内部函数)获取选定值 */
        get value(): T | undefined { return {} as T | undefined; };
    }

    export interface RetParam<T> {
        value: T;
    }

    export class Enum extends Param<string> {
        private index: number = -1;
        /** 这里的content可以被直接利用链接更改 */
        constructor(public name: string, public content: string[]) {
            super();
        }
        _paramIsThis(str: string) {
            let i = this.content.findIndex((v) => (v == str));
            this.index = i;
            return i != -1;
        }
        _clear() { this.index = -1; }
        get value() {
            return this.content[this.index];
        }
    }

    export class String extends Param<string> {
        public content: string | undefined;
        constructor(public name: string) {
            super();
        }
        _paramIsThis(str: string) {
            this.content = str;
            return true;
        }
        _clear() {
            this.content = undefined;
        }
        get value() {
            return this.content;
        }
    }

    export class Number extends Param<number> {
        private num: number | undefined;
        constructor(public name: string) {
            super();
        }
        _paramIsThis(str: string) {
            let num = "";
            let l = str.length, i = 0;
            while (i < l) {
                let c = str[i];
                if (["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].indexOf(c) != -1) {
                    if (num == "" || c == "0") { return false; }
                    num += c;
                } else { return false; }
                i++;
            }
            this.num = +num;
            return true;
        }
        _clear() {
            this.num = undefined;
        }
        get value() { return this.num; }
    }

    export class RawText extends Param<string> {
        constructor() { super(); }
    }

    export class Bool extends Param<boolean> {

    }
}

/** 命令系统 */
class TMBotCommandSystem<
    RunCmdNeedPerm extends TMBotCommandPerm,
    CmdRunner extends TMBotCommandRunner<RunCmdNeedPerm>,
    CmdOutput extends TMBotCommandOutput>{
    private cmdList: { [key: string]: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput> } = {};
    constructor() { }

    execute(str: string, runner: CmdRunner, output: CmdOutput) {

    }
    /** 向命令系统注册命令 */
    regCommand(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) {
        this.cmdList[cmd.cmd] = cmd;

    }
}

/** 作为父类存在 */
export class TMBotCommandPerm {
    constructor() { }
}

/** 单个命令 */
class TMBotCommand<
    RunCmdNeedPerm extends TMBotCommandPerm,
    CmdRunner extends TMBotCommandRunner<RunCmdNeedPerm>,
    CmdOutput extends TMBotCommandOutput> {
    private inRunning: boolean = false;
    private params = new Set<CommandParams.Param<any>>();
    private isRegistered: boolean = false;
    constructor(private cmd_: string, private needPerm: RunCmdNeedPerm) { }
    get cmd() { return this.cmd_; }
    //请使用此函数来解除命令占用
    RunningCompleted() {
        this.params.forEach((v) => { v })
    }
    setup(...args: any[]) { }
}

/** 作为父类存在 */
export class TMBotCommandRunner<CmdPerm extends TMBotCommandPerm> {
    constructor(perm: CmdPerm, ...args: any[]) { }
}

/** 作为父类存在 */
export class TMBotCommandOutput {
    constructor() { }
    success(...args: any[]): any { };
    error(...args: any[]): any { };
}