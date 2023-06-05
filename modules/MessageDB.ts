import { LevelDB } from "../tools/leveldb";
import { GuildMsgTypeEx } from "./QQChannelTypes/GuildMsgInfo";
import { MsgTypeInfoEx } from "./QQDataTypes/MsgInfo";

export class MessageDB {
    public level: LevelDB | undefined;
    constructor(private dir: string) { }
    Init() {
        this.level = new LevelDB(this.dir);
    }
    getMsg(msg_id: number) {
        if (this.level == null) { this.Init(); }
        return this.level!.get<MsgTypeInfoEx>(`QQ_${msg_id}`);
    }
    setMsg(msg_id: number, data: MsgTypeInfoEx) {
        if (this.level == null) { this.Init(); }
        return this.level!.set(`QQ_${msg_id}`, data);
    }

    getGuildMsg(msg_id: string) {
        if (this.level == null) { this.Init(); }
        return this.level!.get<GuildMsgTypeEx>(`Guild_${msg_id}`);
    }
    setGuildMsg(msg_id: string, data: GuildMsgTypeEx) {
        if (this.level == null) { this.Init(); }
        return this.level!.set(`Guild_${msg_id}`, data);
    }
}