

type bool = boolean;
type int32 = number;

type Reaction_Info = {
    "emoji_id": string,	//表情ID
    "emoji_index": int32,	//表情对应数值ID
    "emoji_type": int32,	//表情类型
    "emoji_name": string,	//表情名字
    "count": int32,	//当前表情被贴数量
    "clicked": bool	//BOT是否点击
};

/**
 * 当前消息被贴表情列表信息
 */
export class ReactionInfos {
    private list = new Set<ReactionInfo>()
    constructor(private reactions: Reaction_Info[]) {
        let l = reactions.length, i = 0;
        while (i < l) {
            let n = new ReactionInfo(reactions[i]);
            this.list.add(n);
            i++;
        }
    }
    get size() { return this.list.size; }
    getValues() {
        return this.list.values();
    }
    forEach(fn: (v: ReactionInfo, i: number) => bool) {
        let i = 0;
        let it = this.list.values();
        let now = it.next();
        while (!now.done) {
            if (fn(now.value, i) === true) {
                return now.value;
            }
            i++;
            now = it.next();
        }
    }
}

/**
 * 消息被贴表情信息
 */
class ReactionInfo {
    constructor(private obj: Reaction_Info) { }
    /** 表情ID */
    get emoji_id() { return this.obj.emoji_id; }
    /** 表情对应数值ID */
    get emoji_index() { return this.obj.emoji_index; }
    /** 表情类型 */
    get emoji_type() { return this.obj.emoji_type; }
    /** 表情名字 */
    get emoji_name() { return this.obj.emoji_name; }
    /** 当前表情被贴数量 */
    get count() { return this.obj.count; }
    /** BOT是否点击 */
    get clicked() { return this.obj.clicked; }
}