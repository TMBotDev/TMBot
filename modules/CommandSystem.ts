import { Logger } from "../tools/logger";
import { OffsetException } from "./OffsetException";
import { TEvent } from "./TEvent";

let logger = new Logger("CommandSystem");

export namespace TMBotCmd {
    export namespace CommandParams {
        /** 
         * 父 
         * @note 此类的衍生类不允许参数含有空格!!!
         * @note 此类的衍生类不允许参数含有空格!!!
         * @note 此类的衍生类不允许参数含有空格!!!
         */
        export class Param<T> {
            private _isMandatory = true;
            /** 是否为必要参数 */
            get isMandatory() { return this._isMandatory; }
            /** 设置此参数为非必须参数 */
            setNotMandatory() {
                this._isMandatory = false;
                return this;
            }
            /** (内部函数)参数是否是自己 */
            _paramIsThis(str: string, oriRes: string[], index: number): boolean { return true; }
            /** (内部函数)清除内容,如果不做处理会残留数据! */
            _clear(): void { }
            /** (内部函数)获取选定值 */
            get value(): T | undefined { return {} as T | undefined; };
            toString(): string { return "<Unknown>"; }
        }

        /** 不知道干嘛的 */
        export interface RetParam<T> {
            value: T;
        }

        export class Enum extends Param<string> {
            private index: number = -1;
            /** 这里的content可以被直接利用引用更改,更改后如果有Help命令记得手动更新参数 */
            constructor(public name: string, public content: string[]) {
                let set = new Set(content);
                content = [];
                set.forEach((v) => { content.push(v); })
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
            toString() {
                let content = `Enum(${this.name}):${this.content.join("|")}`;
                return this.isMandatory ? `<${content}>` : `[${content}]`;
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
            toString() {
                let content = `String(${this.name})`;
                return this.isMandatory ? `<${content}>` : `[${content}]`;
            }
        }

        export class Number extends Param<number> {
            private num: number | undefined;
            constructor(public name: string, public isFloat: boolean) {
                super();
            }
            _paramIsThis(str: string) {
                let num = "";
                let l = str.length, i = 0;
                while (i < l) {
                    let c = str[i];
                    let arr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                    this.isFloat && arr.push(".");
                    if (arr.indexOf(c) != -1) {
                        if (num == "" && c == "0" && l != 1) { return false; }
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
            toString() {
                let content = `Number[${this.isFloat ? "Float" : "Int"}](${this.name})`;
                return this.isMandatory ? `<${content}>` : `[${content}]`;
            }
        }

        export class RawText extends Param<string> {
            private rawText: string | undefined;
            constructor(public name: string) { super(); }
            _paramIsThis(_str: string, oriRes: string[], index: number) {
                this.rawText = oriRes.slice(index).join(" ");
                return true;
            }
            _clear() {
                this.rawText = undefined;
            }
            get value() {
                return this.rawText;
            }
            toString() {
                let content = `RawText(${this.name})`;
                return this.isMandatory ? `<${content}>` : `[${content}]`;
            }
        }

        export class Bool extends Param<boolean> {
            private boolVal: boolean | undefined;
            constructor(public name: string) { super(); }
            _paramIsThis(str: string) {
                let index = ["true", "false"].indexOf(str);
                if (index != -1) {
                    this.boolVal = (index == 0);
                    return true;
                }
                return false;
            }
            _clear() {
                this.boolVal = undefined;
            }
            get value() {
                return this.boolVal;
            }
            toString() {
                let content = `Boolean(${this.name}):true|false`;
                return this.isMandatory ? `<${content}>` : `[${content}]`;
            }
        }
    }

    //非常古老的代码
    function cmdFH(str = "") {
        let re = /[#]*"([^"]+)"|([^#]+)/g;
        let match;
        str = str.replace(/[ ]/g, '#');
        let arr: string[] = [];
        while (match = re.exec(str)) {
            let val = (match[1] || match[2]).replace(/[#]/g, ' '),
                index = (val.indexOf("\"")),
                lastIndex = (val.lastIndexOf("\"") + 1);
            if (index == -1 || (index == (lastIndex - 1))) {
                arr.push(val);
                continue;
            }
            let value = val.slice(index, lastIndex).replace(/"/g, '\\\"');
            value = value.replace("\\", "");
            let va = value.split(""), tmp;
            va[(va.length - 2)] = "";
            try {
                tmp = JSON.parse(`{"key": ${va.join("")}}`);
            } catch (_) {
                tmp = { "key": va.join("") };
            }
            arr.push(tmp.key);
        }
        return arr;
    }

    let AllTMBotCmdSystemInstance = new Map<string, TMBotCommandSystem<TMBotCommandPerm<any>, TMBotCommandRunner<TMBotCommandPerm<any>>, TMBotCommandOutput>>();

    /** 命令系统 */
    export class TMBotCommandSystem<
        RunCmdNeedPerm extends TMBotCommandPerm<any>,
        CmdRunner extends TMBotCommandRunner<RunCmdNeedPerm>,
        CmdOutput extends TMBotCommandOutput>{
        private cmdList: { [key: string]: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput> } = {};
        private cmdClass: typeof TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>;
        private eventLogType = {
            error: (...args: any[]) => {
                return logger.error(`命令系统: "${this.name}" 异常: `, ...args);
            }
        };
        private _events = {
            "onCmdRunningCompleted": new TEvent<(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) => void>(this.eventLogType),
            "onCmdOverloaded": new TEvent<(
                cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                param: {
                    "params": CommandParams.Param<any>[],
                    "fn": (
                        cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                        cmdRunner: CmdRunner,
                        output: CmdOutput,
                        params: CommandParams.Param<unknown>[]
                    ) => void
                }) => void>(this.eventLogType),
            "onCmdUnOverloaded": new TEvent<(
                cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                param: {
                    "params": CommandParams.Param<any>[],
                    "fn": (
                        cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                        cmdRunner: CmdRunner,
                        output: CmdOutput,
                        params: CommandParams.Param<unknown>[]
                    ) => void
                }) => void>(this.eventLogType),

            "onCmdRegister": new TEvent<(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) => void>(this.eventLogType),
            "onCmdLogout": new TEvent<(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) => void>(this.eventLogType),
            "onCmdSetAlias": new TEvent<(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>, alias: string) => void>(this.eventLogType)
        };
        constructor(private _name: string) {
            if (AllTMBotCmdSystemInstance.has(_name)) {
                throw new Error(`已有名称为: <${_name}> 的命令系统!`);
            }
            let _this = this;
            class Cmd extends TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>{
                setup(): boolean {
                    return _this.regCommand(this);
                }
            }
            this.cmdClass = Cmd;
            AllTMBotCmdSystemInstance.set(_name, this as any);
        }

        get name() { return this._name; }
        get events() { return this._events; }

        fetchCmd(cmd: string) {
            for (let key in this.cmdList) {
                let cmdIns = this.cmdList[key];
                if (cmdIns.cmd == cmd || cmdIns.alias == cmd) {
                    return cmdIns;
                }
            }
            return undefined;
        }
        getCmdList() {
            let set = new Set<TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>>();
            for (let key in this.cmdList) {
                set.add(this.cmdList[key]);
            }
            return set;
        }

        private setCmdListen(obj: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) {
            obj.events.onOverloaded.onEx((time, param) => {
                this._events.onCmdOverloaded.fire(
                    `CommandSystem_${this.name}_ProcessCmd_${obj.cmd}_Event_CmdOverloaded`,
                    time,
                    obj,
                    param
                );
            });
            obj.events.onRunningCompleted.onEx((time) => {
                this._events.onCmdRunningCompleted.fire(
                    `CommandSystem_${this.name}_ProcessCmd_${obj.cmd}_Event_CmdRunningCompleted`,
                    time,
                    obj
                );
            });
            obj.events.onUnOverloaded.onEx((time, param) => {
                this._events.onCmdUnOverloaded.fire(
                    `CommandSystem_${this.name}_ProcessCmd_${obj.cmd}_Event_CmdUnOverloaded`,
                    time,
                    obj,
                    param
                );
            });
            obj.events.onSetAlias.onEx((time, alias) => {
                delete this.cmdList[obj.alias || ""];
                this.cmdList[alias] = obj;
                this._events.onCmdSetAlias.fire(
                    `CommandSystem_${this.name}_ProcessCmd_${obj.cmd}_Event_CmdSetAlias`,
                    time,
                    obj,
                    alias
                );
            });
        }

        /**
         * 新建命令
         * @param cmd 主命令 主命令不得含有空格字符和大写字母!(不推荐使用中文来命名)
         * @param description 命令解释
         * @param perm 运行所需权限
         */
        newCommand(cmd: string, description: string, perm: RunCmdNeedPerm) {
            let obj = new this.cmdClass(cmd, description, perm, this);
            return obj;
        }

        _execute(str: string, runner: CmdRunner, output: CmdOutput, emptyCmdErrorOutput = true, onRunningCompleted = () => { }) {
            str = str.trim();
            let res = cmdFH(str);
            let cmd = res.shift() || "";
            if (!this.cmdList[cmd]) {
                if (cmd == "") {
                    emptyCmdErrorOutput && output.error(`命令: "${cmd}" 不存在!`);
                } else { output.error(`命令: "${cmd}" 不存在!`); }
                return false;
            }
            let cmdInst = this.cmdList[cmd]!;
            if (cmdInst.isEligible(runner.perm)) {
                let name = cmdInst.events.onRunningCompleted.on(() => {
                    onRunningCompleted();
                    cmdInst.events.onRunningCompleted.un(name);
                });
                return cmdInst._runCmd(runner, output, res);
            } else {
                output.error(`你无权执行此命令!`);
                return false;
            }
        }
        /** 向命令系统注册命令 */
        regCommand(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) {
            if (!(cmd instanceof this.cmdClass)) {
                logger.error(`注册命令失败!该命令无法识别为此命令系统(${this.name})的命令!`);
                return false;
            }
            if (!this.cmdList[cmd.cmd]! && !this.cmdList[cmd.alias || ""]) {
                this._events.onCmdRegister.fire(
                    `CommandSystem_${this.name}_ProcessCmd_Event_CmdRegister`,
                    undefined,
                    cmd
                );
                this.cmdList[cmd.cmd] = cmd;
                !!cmd.alias && (this.cmdList[cmd.alias] = cmd);
                (function (this: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) {
                    this._isRegistered = true;
                }).call(cmd);
                this.setCmdListen(cmd);
                return true;
            }
            logger.warn(`命令系统: [${this._name}] 注册命令: "${cmd.cmd}"${!cmd.alias ? "" : `(${cmd.alias})`} 失败!请检查命令是否已被注册!`);
            return false;
        }
        /** 注销命令 */
        logoutCommand(cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>) {
            if (!(cmd instanceof this.cmdClass)) {
                logger.error(`注销命令失败!该命令无法识别为此命令系统(${this.name})的命令!`);
                return false;
            }
            if (!this.cmdList[cmd.cmd]) {
                logger.error(`注销命令失败!该命令没有注册到此命令系统(${this.name})!`);
                return false;
            }
            this._events.onCmdLogout.fire(
                `CommandSystem_${this.name}_ProcessCmd_Event_CmdLogout`,
                undefined,
                cmd
            );
            cmd.events.onOverloaded.clear();
            cmd.events.onRunningCompleted.clear();
            cmd.events.onUnOverloaded.clear();
            cmd.events.onSetAlias.clear();
            delete this.cmdList[cmd.cmd];
            delete this.cmdList[cmd.alias || ""];
            return true;
        }
    }

    /** 命令权限(作为父类存在) */
    export class TMBotCommandPerm<T extends TMBotCommandPerm<any>> {
        constructor() { }
        /** 是否符合资格 */
        isEligible(perm: T) {
            return true;
        }
    }

    /** 
     * 单个命令 
     */
    class TMBotCommand<
        RunCmdNeedPerm extends TMBotCommandPerm<any>,
        CmdRunner extends TMBotCommandRunner<RunCmdNeedPerm>,
        CmdOutput extends TMBotCommandOutput> {
        private _inRunning: boolean = false;
        private params = new Set<CommandParams.Param<any>>();
        protected _isRegistered: boolean = false;
        private _alias: string | undefined;
        private eventLogType = {
            error: (...args: any[]) => {
                return logger.error(`命令系统: "${this.cmdSystem.name}" 命令: "${this.cmd_} 异常: `, ...args);
            }
        };
        private _events = {
            "onRunningCompleted": new TEvent<() => void>(this.eventLogType),
            "onOverloaded": new TEvent<(param: {
                "params": CommandParams.Param<any>[],
                "fn": (
                    cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                    cmdRunner: CmdRunner,
                    output: CmdOutput,
                    params: CommandParams.Param<unknown>[]
                ) => void
            }) => void>(this.eventLogType),
            "onUnOverloaded": new TEvent<(param: {
                "params": CommandParams.Param<any>[],
                "fn": (
                    cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                    cmdRunner: CmdRunner,
                    output: CmdOutput,
                    params: CommandParams.Param<unknown>[]
                ) => void
            }) => void>(this.eventLogType),
            "onSetAlias": new TEvent<(alias: string) => void>(this.eventLogType)
        }
        protected overloads: {
            "params": CommandParams.Param<any>[],
            "fn": (
                cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>,
                cmdRunner: CmdRunner,
                output: CmdOutput,
                params: CommandParams.Param<unknown>[]
            ) => void
        }[] = [];
        constructor(private cmd_: string, private _description: string, private needPerm: RunCmdNeedPerm, private cmdSystem: TMBotCommandSystem<RunCmdNeedPerm, CmdRunner, CmdOutput>) {
            if (cmd_.indexOf(" ") != -1) {
                throw new OffsetException(3, `主命令不得含有空格字符`);
            } else if (cmd_ == "") {
                throw new OffsetException(3, `主命令不得以空字符定义`);
            } else if (cmd_ != cmd_.toLowerCase()) {
                throw new OffsetException(3, `主命令不得含有大写字母`);
            }
        }
        get cmd() { return this.cmd_; }
        get alias() { return this._alias; }
        get description() { return this._description; }
        get inRunning() { return this._inRunning; }
        get isRegistered() { return this._isRegistered; }
        get events() { return this._events; }
        setAlias(str: string) {
            if (str.indexOf(" ") != -1) {
                throw new OffsetException(1, `命令别名不得含有空格字符`);
            } else if (str == "") {
                throw new OffsetException(1, `命令别名不得以空字符定义`);
            } else if (str != str.toLowerCase()) {
                throw new OffsetException(1, `命令别名不得含有大写字母`);
            }
            if (!!this.cmdSystem.fetchCmd(str)) {
                throw new OffsetException(1, `命令别名于其他命令冲突`);
            }
            this._events.onSetAlias.fire(
                `CommandSystem_${this.cmdSystem.name}_ProcessCmd_${this.cmd}_Event_SetAlias`,
                undefined,
                str
            );
            this._alias = str;
        }
        /** 是否符合条件 */
        isEligible(perm: RunCmdNeedPerm) {
            return this.needPerm.isEligible(perm);
        }
        /**请使用此函数来解除命令占用*/
        RunningCompleted() {
            if (!this._inRunning) { return; }
            this.params.forEach((v) => { v._clear(); })
            this._events.onRunningCompleted.fire(
                `CommandSystem_${this.cmdSystem.name}_ProcessCmd_${this.cmd}_Event_RunningCompleted`,
                null
            );
            this._inRunning = false;
        }

        _runCmd(runner: CmdRunner, output: CmdOutput, params: string[]) {
            if (this._inRunning) {
                output.error(`该命令正在被执行!请等待上一次命令执行完成!`);
                return false;
            }
            this._inRunning = true;
            if (this.overloads.length == 0) {
                logger.warn(`命令: "${this.cmd}" 没有指令重载!无法被运行!`);
                this.RunningCompleted();
                return false;
            }

            let res = this.overloads.find((v) => {
                try {
                    let cmdParams = v.params;
                    if (cmdParams.length < params.length) {
                        return false;
                    }
                    let l = cmdParams.length, i = 0;
                    while (i < l) {
                        let cmdParam = cmdParams[i];
                        if (!cmdParam.isMandatory) {
                            cmdParam._paramIsThis(params[i], params, i);
                            // console.log("e", cmdParam.constructor.name)
                        } else {
                            if (!cmdParam._paramIsThis(params[i], params, i)) {
                                return false;
                            }
                        }
                        i++;
                    }
                } catch (_) {
                    // logger.error(_.stack)
                    return false;
                }
                return true;
            });
            if (!!res) {
                try {
                    res.fn(this, runner, output, res.params);
                } catch (e: any) {
                    logger.error(`命令: "${this.cmd}" 回执函数运行失败!`);
                    logger.error(e.toString());
                }
                return true;
            } else {
                output.error(`未匹配到相关的命令重载!`);
            }
            this.RunningCompleted();
            return false;
        }


        overload<T extends CommandParams.Param<unknown>[]>(params: T) {
            let l = params.length, i = 0;
            let canHasMandatory = true;
            while (i < l) {
                let param = params[i];
                if (canHasMandatory) {
                    canHasMandatory = param.isMandatory;
                } else if (param.isMandatory) {
                    logger.warn(`命令: "${this.cmd}" 注册指令重载失败!原因:在非必须参数出现后就不可出现必须参数了!`);
                    return undefined;
                }
                if (param instanceof CommandParams.RawText) {
                    if (!!params[(i + 1)]) {
                        logger.warn(`命令: "${this.cmd}" 注册指令重载失败!原因:在RawText之后不能有任何参数了!`);
                        return undefined;
                    }
                }
                i++;
            }
            let overloadInst = {
                "params": params,
                "fn": (cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>, _cmdRunner: CmdRunner, _cmdOutput: CmdOutput, _params: T) => {
                    logger.warn(`命令:${cmd.cmd}可能部分指令重载没有进行处理!请联系该命令注册者!`);
                    cmd.RunningCompleted();
                }
            };
            this.overloads.push(overloadInst as any);
            this._events.onOverloaded.fire(
                `CommandSystem_${this.cmdSystem.name}__ProcessCmd_${this.cmd_}_Event_Overloaded`,
                undefined,
                overloadInst as any
            );
            return (fn: (cmd: TMBotCommand<RunCmdNeedPerm, CmdRunner, CmdOutput>, cmdRunner: CmdRunner, _cmdOutput: CmdOutput, params: T) => void) => {
                overloadInst.fn = fn;
                return this;
            };
        }

        /** 
         * 注销命令重载
         * @note 必须传入
         */
        unOverload<T extends CommandParams.Param<unknown>[]>(params: T) {
            let index = this.overloads.findIndex(v => v.params == params);
            if (index == -1) { return false; }
            let res = this.overloads[index];
            this.overloads.splice(index, 1);
            this._events.onOverloaded.fire(
                `CommandSystem_${this.cmdSystem.name}__ProcessCmd_${this.cmd_}_Event_UnOverloaded`,
                undefined,
                res
            );
            return true;
        }

        /** 注册命令(TMBotCommandSystem.regCommand) */
        setup(): boolean { return false; }
    }

    /** 命令运行者(作为父类存在) */
    export class TMBotCommandRunner<CmdPerm extends TMBotCommandPerm<any>> {
        constructor(public perm: CmdPerm) { }
    }

    /** 命令输出(作为父类存在) */
    export class TMBotCommandOutput {
        constructor() { }
        success(...args: any[]): any { };
        error(...args: any[]): any { };
    }

    function splitArr<T extends any>(arr: T[], num: number) {
        let arg: Array<T[]> = [[]];
        let nowIndex = 0;
        let tmp = 0;
        let l = arr.length, i = 0;
        while (i < l) {
            let v = arr[i];
            if (tmp >= num) {
                nowIndex++;
                arg.push([]);
                tmp = 0;
            }
            arg[nowIndex].push(v);
            tmp++;
            i++;
        }
        return arg;
    }

    function MapMap<K, V>(map: Map<K, V>) {
        let k = [], v = [];
        let iters = map.entries();
        let iter = iters.next();
        while (!iter.done) {
            k.push(iter.value[0]);
            v.push(iter.value[1]);
            iter = iters.next();
        }
        return [k, v] as [K, V];
    }

    type UpdateArg = {
        "isDelete": true,
        "cmd": string
    } | {
        "isDelete": false,
        "cmd": string,
        "overloads": string[]
    }

    export class HelpCmdHelper {
        private list = new Map<string, { "cmd": TMBotCommand<any, any, any>, "des": string[] }>();
        private helpCmd: TMBotCommand<TMBotCommandPerm<any>, TMBotCommandRunner<any>, TMBotCommandOutput>;
        private cache: Map<string, string[]> = new Map();
        constructor(private cmdSystem: TMBotCommandSystem<any, any, any>) {
            this.helpCmd = cmdSystem.newCommand(`help`, `命令帮助`, { "isEligible": () => true } as TMBotCommandPerm<any>);
            this.helpCmd.setAlias("?");

            this.helpCmd.overload([])!((cmd, _runner, out, _params) => {
                let arr = MapMap(this.cache)[1];
                let content = ([] as string[]).concat(...arr);
                let pages = splitArr(content, 7);
                let nowPageNum = 1;
                let nowPage = pages[(nowPageNum - 1)];
                out.success(`§a---TMBot命令帮助(${nowPageNum}/${pages.length})---`);
                nowPage.forEach((v) => {
                    out.success(v);
                });
                cmd.RunningCompleted();
            });

            this.helpCmd.overload([new CommandParams.Number("Page", false)])!((cmd, _runner, out, params) => {
                let arr = MapMap(this.cache)[1];
                let content = ([] as string[]).concat(...arr);
                let pages = splitArr(content, 7);
                let nowPageNum = params[0].value!;
                if (nowPageNum < 1 || nowPageNum > pages.length) {
                    out.error(`帮助页码不能低于1或高于${pages.length}!`);
                    return cmd.RunningCompleted();
                }
                let nowPage = pages[(nowPageNum - 1)];
                out.success(`§a---TMBot命令帮助(${nowPageNum}/${pages.length})---`);
                nowPage.forEach((v) => {
                    out.success(v);
                });
                cmd.RunningCompleted();
            });

            this.helpCmd.overload([new CommandParams.String("cmd")])!((cmd, _runner, out, params) => {
                let nowSelCmd = params[0].value!;
                let res = this.list.get(nowSelCmd);
                if (!res) {
                    out.error(`未找到命令: "${nowSelCmd}"`);
                    return cmd.RunningCompleted();
                }
                let { cmd: SelCmd, des: overloads } = res;
                out.success(`§e命令 ${SelCmd.cmd}${(SelCmd.alias ? `(${SelCmd.alias})` : "")}`);
                out.success(`§e说明: ${SelCmd.description}`);
                out.success(`§e用法:`);
                overloads.forEach((v) => {
                    out.success(v);
                });
                cmd.RunningCompleted();
            });
        }

        private getCmdHelps<T extends TMBotCommand<any, any, any>>(cmd: T) {
            let arr: string[] = [];
            let overloads = (function (this: T) { return this.overloads; }).call(cmd);
            overloads.forEach((v) => {
                let line = ``;
                v.params.forEach((v) => {
                    line += ` ${v.toString()}`;
                });
                arr.push(line);
            });
            return (isAlias: boolean) => {
                if (isAlias) {
                    return arr.map((v) => { return `/${cmd.alias}${v}`; });
                } else {
                    return arr.map((v) => { return `/${cmd.cmd}${v}`; });
                }
            };
        }

        private _setValue(now: TMBotCommand<any, any, any>) {
            this.list.delete(now.cmd);
            if (!!now.alias) {
                this.list.delete(now.alias);
            }
            let helps = this.getCmdHelps(now);
            let help1 = helps(false);
            this.list.set(now.cmd, { "cmd": now, "des": help1 });
            this.__setHelpCache({ "isDelete": false, "cmd": now.cmd, "overloads": help1 });
            if (!!now.alias) {
                let help2 = helps(true);
                this.list.set(now.alias, { "cmd": now, "des": help2 });
                this.__setHelpCache({ "isDelete": false, "cmd": now.alias, "overloads": help2 });
            }
        }
        delete(cmd: string) {
            let help = this.list.get(cmd);
            if (!help) { return false; }
            this.list.delete(help.cmd.cmd);
            this.__setHelpCache({ "isDelete": true, "cmd": help.cmd.cmd });
            if (!!help.cmd.alias) {
                this.list.delete(help.cmd.alias);
                this.__setHelpCache({ "isDelete": true, "cmd": help.cmd.alias });
            }
            return true;
        }
        update(cmd?: string) {
            if (!!cmd) {
                let now = this.cmdSystem.fetchCmd(cmd);
                if (!now) { return false; }
                this._setValue(now);
                return true;
            }
            let cmdList = this.cmdSystem.getCmdList();
            cmdList.forEach((v) => {
                this._setValue(v);
            });
            return true;
        }
        __setHelpCache(arg: UpdateArg) {
            if (arg.isDelete) {
                this.cache.delete(arg.cmd);
                return true;
            }
            let _cache: string[] = arg.overloads;
            this.cache.set(arg.cmd, _cache);
            return true;
        }
        /** 运行此函数后会自动更新命令帮助列表,请在此之前之前运行update函数 */
        setup() {
            this.cmdSystem.events.onCmdRegister.on((cmd) => {
                this._setValue(cmd);
                // console.log("update1", this.list);
            });
            this.cmdSystem.events.onCmdLogout.on((cmd) => {
                this.delete(cmd.cmd);
                // console.log("update2", this.list);
            });
            this.cmdSystem.events.onCmdSetAlias.on((cmd, _alias) => {
                this._setValue(cmd);
                // console.log("update3", this.list);
            });
            this.helpCmd.setup();
        }
    }
}

//使用实例
// (() => {
//     //构建基础命令系统框架
//     class perm extends TMBotCmd.TMBotCommandPerm {

//     }
//     class runner extends TMBotCmd.TMBotCommandRunner<perm>{
//         say() { return "hello world"; }
//     }
//     class out extends TMBotCmd.TMBotCommandOutput {
//         success(...args: any[]) {
//             console.log("success:" + args);
//         }
//         error(...args: any[]) {
//             console.log("error:" + args);
//         }
//     }
//     let system = new TMBotCmd.TMBotCommandSystem<perm, runner, out>("test");

//     //开始注册命令
//     let bool = new TMBotCmd.CommandParams.Bool("233");
//     let string1 = new TMBotCmd.CommandParams.String("azz");
//     //设置这参数可不选
//     string1.setNotMandatory();
//     let enum1 = new TMBotCmd.CommandParams.Enum("enum1", ["zxc", "cxz"]);
//     //这里为了调整参数值才这么写的,图方便的话可以不这么干
//     let over: [TMBotCmd.CommandParams.Bool, TMBotCmd.CommandParams.String] = [bool, string1];
//     let over1: [TMBotCmd.CommandParams.Bool, TMBotCmd.CommandParams.Enum] = [over[0], enum1];
//     system.newCommand("test", "testCmd", new perm())
//         .overload(over1)!((cmd, runner, output, params) => {
//             console.log("res2", params);
//             //解除占用
//             cmd.RunningCompleted();
//         })
//         .overload(over)!((cmd, cmdRunner, cmdOutput, params) => {
//             console.log("res1", params);
//             cmd.RunningCompleted();
//         }).setup();

//     //运行部分
//     let permIns = new perm();
//     system._execute("test true zxc", new runner(permIns), new out());
// })();