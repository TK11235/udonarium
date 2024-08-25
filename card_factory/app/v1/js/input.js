var MSGK = MSGK || {};
MSGK.INPUT = MSGK.INPUT || {};

MSGK.INPUT.CONSTS = {
    TABLE_CLASS: 'consensus-contents',
    UPDATE_EVENT: 'MSGK_INPUT_UPDATE',
};

MSGK.INPUT.DOMS = {
    TABLE: document.getElementsByClassName('consensus-contents')[0],
};

MSGK.INPUT.appendLine = (e) => {
    const tr = document.createElement('tr');
    const contentClass = `${MSGK.INPUT.CONSTS.TABLE_CLASS}-content`;
    tr.className = contentClass;
    [
        `<button class="${contentClass}-remove">✕</button>`,
        `<select class="${contentClass}-okng">
            <option value="ng">NG</option>
            <option value="ok">OK</option>
        </select>`,
        `<input type="text" class="${contentClass}-target" list="${contentClass}-targetlist" />`,
        `<input type="text" class="${contentClass}-content" />`,
        `<input type="text" class="${contentClass}-detail" />`,
    ].forEach((content)=>{
        const td = document.createElement('td');
        td.innerHTML = content;
        tr.appendChild(td);
    });
    MSGK.INPUT.DOMS.TABLE.append(tr);
    MSGK.INPUT.onUpdate();
};

MSGK.INPUT.bindEvents = () => {
    const contentClass = `${MSGK.INPUT.CONSTS.TABLE_CLASS}-content`;
    MSGK.INPUT.DOMS.TABLE.addEventListener('click', (e)=>{
        if( e.target.className === `${contentClass}-remove` ) {
            e.target.parentElement.parentElement.remove();
            MSGK.INPUT.onUpdate();
        }
    });
    MSGK.INPUT.DOMS.TABLE.addEventListener('input', MSGK.INPUT.onUpdate);
    document.getElementsByClassName(`input-append`)[0].addEventListener('click', MSGK.INPUT.appendLine);
};

MSGK.INPUT.getCardInfo = () => {
    const table = MSGK.INPUT.DOMS.TABLE;
    const contentClass = `${MSGK.INPUT.CONSTS.TABLE_CLASS}-content`;
    const columns = ['okng', 'target', 'content', 'detail'];
    const result = [];
    columns.forEach((column, i)=>{
        const vals = Array.from(table.getElementsByClassName(`${contentClass}-${column}`)).map((element)=>{ return element.value; });
        vals.forEach((value, j)=>{
            if(! result[j]) { result.push({}); }
            result[j][column] = value;
        });
    });
    return result;
};

MSGK.INPUT.onUpdate = (e) => {
    const event = new Event(MSGK.INPUT.CONSTS.UPDATE_EVENT, {
        bubbles: true, cancelable: true,
    });
    MSGK.INPUT.DOMS.TABLE.dispatchEvent(event);
};

MSGK.INPUT.buildTargetList = () => {
    const datalist = document.createElement('datalist');
    datalist.id = `${MSGK.INPUT.CONSTS.TABLE_CLASS}-content-targetlist`;
    [
        '自分のPCが', '自分以外のPCが', '自分を含むPCが',
        '自分のPCと親密な相手が', '自分以外のPCと親密な相手が', '自分を含むPCと親密な相手が',
        '主要なNPCが', '全てのNPCが', '全てのキャラクターについて', 'あらゆる場面について'
    ].forEach((d)=>{
        const option = document.createElement('option');
        option.value = d;
        datalist.appendChild(option);
    });
    document.getElementsByClassName('input')[0].append(datalist);
};

MSGK.INPUT.initialize = () => {
    MSGK.INPUT.buildTargetList();
    MSGK.INPUT.appendLine();
    MSGK.INPUT.bindEvents();
};
