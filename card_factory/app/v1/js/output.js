var MSGK = MSGK || {};
MSGK.OUTPUT = MSGK.OUTPUT || {};

MSGK.OUTPUT.DOMS = {
    BASE: document.getElementsByClassName('output')[0],
};

MSGK.OUTPUT.CONSTS = {
    SAVE_EVENT: 'MSGK_OUTPUT_SAVE',
};

MSGK.OUTPUT.buildOutput = (cards) => {
    const base = document.getElementsByClassName('output-cards')[0];
    base.innerHTML = '';
    cards.forEach((card)=>{
        const cardBase = document.createElement('div');
        cardBase.className = `card ${card.okng}-card`;
        ['target', 'content', 'detail'].forEach((column)=>{
            const span = document.createElement('span');
            span.className = column;
            span.textContent = card[column];
            cardBase.appendChild(span);
        });
        const span = document.createElement('span');
        span.className = 'stump';
        cardBase.appendChild(span);
        base.appendChild(cardBase);
    });
};

MSGK.OUTPUT.initialize = () => {
    const cards = document.createElement('div');
    cards.className = `output-cards`;
    MSGK.OUTPUT.DOMS.BASE.append(cards);
    const save = document.createElement('button');
    save.textContent = '画像として保存';
    save.className = `output-save`;
    MSGK.OUTPUT.DOMS.BASE.append(save);
    save.addEventListener('click', (e)=>{
        const event = new Event(MSGK.OUTPUT.CONSTS.SAVE_EVENT, {
            bubbles: true, cancelable: true,
        });
        save.dispatchEvent(event);
    });
};
