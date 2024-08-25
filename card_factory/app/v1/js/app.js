var MSGK = MSGK || {};
MSGK.APP = MSGK.APP || {};

MSGK.INPUT.initialize();
MSGK.OUTPUT.initialize();

document.getElementsByClassName('input')[0].addEventListener(MSGK.INPUT.CONSTS.UPDATE_EVENT, (e)=>{
    const cards = MSGK.INPUT.getCardInfo();
    MSGK.OUTPUT.buildOutput(cards);
});

document.getElementsByClassName('output')[0].addEventListener(MSGK.OUTPUT.CONSTS.SAVE_EVENT, (e)=>{
    html2canvas(document.getElementsByClassName('output-cards')[0]).then(canvas => {
        let downloadEle = document.createElement("a");
        downloadEle.href = canvas.toDataURL("image/png");
        downloadEle.download = `consensus_card.png`;
        downloadEle.click();
        downloadEle.remove();
    });
});

