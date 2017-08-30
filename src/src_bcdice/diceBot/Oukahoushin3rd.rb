# -*- coding: utf-8 -*-

class Oukahoushin3rd < DiceBot
  
  def initialize
    super
  end
  
  def gameName
    '央華封神RPG第三版'
  end
  
  def gameType
    "Oukahoushin3rd"
  end
  
  def prefixs
    []
  end
  
  def getHelpMessage
    return <<INFO_MESSAGE_TEXT
・各種表
　・能力値判定裏成功表（NHT）
　・武器攻撃裏成功表（BKT）
　・受け・回避裏成功表（UKT）
　・仙術行使裏成功表（SKT）
　・仙術抵抗裏成功表（STT）
　・精神値ダメージ悪影響表（SDT）
　・狂気表（KKT）
INFO_MESSAGE_TEXT
  end
  
end


=begin
  def rollDiceCommand(command)
    debug("rollDiceCommand begin string", command)
    
    command = command.upcase
    
    name, table = get2d6TableInfo(command)
    text, total_n = get_table_by_2d6(table)
    result = "#{name}(#{total_n}) ＞ #{output}"
    
    return return
  end
  
  
  def get2d6TableInfo(command)
    
    name = ""
    table = []
    
    case command
    when /CrimeIET/i
      name = "情報イベント表／〔犯罪〕:"
      table = %w{
謎の情報屋チュンさん登場。ターゲットとなる情報を渡し、いずこかへ去る。情報ゲット！
昔やった仕事の依頼人が登場。てがかりをくれる。好きなタグの上位リンク（SL+2）を１つ得る。
謎のメモを発見……このターゲットについて調べている間、このトピックのタグをチーム全員が所有しているものとして扱う
謎の動物が亜侠を路地裏に誘う。好きなタグの上位リンクを２つ得る
偶然、他の亜侠の仕事現場に出くわす。口止め料の代わりに好きなタグの上位リンクを１つ得る
あまりに適切な諜報活動。コストを消費せず、上位リンクを３つ得る
その道の権威を紹介される。現在と同じタグの上位リンクを２つ得る
捜査は足だね。〔肉体点〕を好きなだけ消費する。その値と同じ数の好きなタグの上位リンクを得る
近所のコンビニで立ち読み。思わぬ情報が手に入る。上位リンクを３つ得る
そのエリアの支配盟約からメッセンジャーが1D6人。自分のチームがその盟約に敵対していなければ、好きなタグの上位リンクを２つ得る。敵対していれば、メッセンジャーは「盟約戦闘員（p.127）」となる。血戦を行え
「三下（p.125）」が1D6人現れる。血戦を行え。倒した数だけ、好きなタグの上位リンクを手に入れる
}
    when /GetkT/i
      name = "報酬・奇天烈表:"
      table = %w{
好きな盟約おたから１個（プレイヤー全員で相談して決定）
《気球》（基本76p、乗物）
《チェインソー》（基本74p、武器）
誰かから感謝される。それだけ？
持ち主の〔趣味〕からランダムに１種類選ぶ。その趣味おたからを１個ランダムに選ぶ。
何もなかった（涙）。残念でした。
持ち主と同じタイプの汎用おたから（基本82p、汎用おたから）
《フォークリフト》（基本76p、乗物）
《RPG-7》（基本74p、武器）
倒されたキャラクターは、致命傷表を振り、まだ生きていれば、そのキャラクターを倒した者のトリコになる。
「先にイッてるぜ」そのキャラクター１体を倒した者に経験点が１点与えられる。
}
    end
    
    return name, table
  end
=end
