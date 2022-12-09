import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { FileClass } from "../tools/file";
import { Logger } from "../tools/logger";
import * as child_process from 'child_process';

const PLUGIN_DIR = "./plugins/";

let allPackage = new Map<string, PluginPackage>();

let logger = new Logger("PluginLoader");

export class PluginPackage {
    static async LoadAllPackage() {
        if (!FileClass.exists(PLUGIN_DIR)) {
            logger.info(`插件加载目录不存在!自动创建...`);
            FileClass.mkdir(PLUGIN_DIR);
        }
        let dirs = readdirSync(PLUGIN_DIR, { "withFileTypes": true });
        let l = dirs.length, i = 0;
        while (i < l) {
            let dir = dirs[i++];
            if (dir.isDirectory() && (dir.name).toLowerCase() != "data") {
                let fullDir = PLUGIN_DIR + dir.name;
                let tmp = this.loadPlugin(fullDir);
                if (tmp) {
                    logger.info(`加载Node包 [${fullDir}] 成功!`);
                } else {
                    logger.error(`加载Node包 [${fullDir}] 失败!`);
                }
            }
        }
    }
    static loadPlugin(dir: string) {
        try {
            let PackagePath = path.join(dir, "package.json");
            let packageObj = JSON.parse(readFileSync(PackagePath, "utf8"));
            if (packageObj.name != dir.replace(PLUGIN_DIR, "")) {
                throw new Error(`模块名称只能和目录名相同!`);
            }
            let tmp = new PluginPackage(dir, packageObj.name, packageObj.description, packageObj.version);
            tmp.load();
            return tmp;
        } catch (e) {
            logger.error(`Error in load plugin: [${dir}]`);
            logger.error((e as Error).stack);
            return undefined;
        }
    }

    public Exports: NodeRequire | undefined;
    constructor(
        public dir: string,
        public name: string,
        public desc: string | undefined,
        public version: string | undefined
    ) { }
    _CheckDependencies() {
        let PackagePath = path.join(this.dir, "package.json");
        let packageObj = JSON.parse(readFileSync(PackagePath, "utf8"));
        try {
            for (let key in packageObj.dependencies || {}) {
                let ModuleDir = path.join(this.dir, `node_modules/${key}`);
                try {
                    if (!statSync(ModuleDir).isDirectory()) {
                        throw new Error("");
                    }
                } catch (_e) {
                    let e = _e as Error;
                    e.message = `Node包 [${this.dir}] 加载失败!原因: 此插件的依赖包 [${key}] 未安装!`;
                    throw e;
                }
            }
        } catch (_e) {
            console.log(this.dir);
            child_process.execSync(
                `cd "${FileClass.getStandardPath(this.dir)}" && npm i`,
                { "stdio": "inherit" }
            );
        }
    }
    load() {
        // console.log();
        this._CheckDependencies();
        try {
            this.Exports = require("./../" + this.dir);
            allPackage.set(this.name, this);
        } catch (_e) {
            let e = _e as Error;
            e.message = `Node包 [${this.dir}] 加载失败!\n${e.message}`;
            throw e;
        }
    }
    toJson() {
        return {
            "dir": this.dir,
            "name": this.name,
            "desc": this.desc,
            "version": this.version
        };
    }
    // static
}