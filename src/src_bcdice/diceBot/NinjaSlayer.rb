# -*- coding: utf-8 -*-

class NinjaSlayer < DiceBot
  # ダイスボットで使用するコマンドを配列で列挙する
  setPrefixes([
      'NJ\d+.*',
      'EV\d+.*',
      'AT\d+.*'
      ])

  def initialize
    super

    @defaultSuccessTarget = ">=4"
  end

  def gameName
    'ニンジャスレイヤーTRPG'
  end

  def gameType
    "NinjaSlayer"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・通常判定　NJ
　NJx[y] or NJx@y or NJx
　x=判定ダイス y=難易度 省略時はNORMAL(4)
　例:NJ4@H 難易度HARD、判定ダイス4で判定
・回避判定　EV
　EVx[y]/z or EVx@y/z or EVx/z or EVx
　x=判定ダイス y=難易度 z=攻撃側の成功数(省略可) 難易度を省略時はNORMAL(4)
　攻撃側の成功数を指定した場合、カウンターカラテ発生時には表示
　例:EV5/3 難易度NORMAL(省略時)、判定ダイス5、攻撃側の成功数3で判定
・近接攻撃　AT
　ATx[y] or ATx@y or ATx
　x=判定ダイス y=難易度 省略時はNORMAL(4) サツバツ！発生時には表示
　例:AT6[H] 難易度HARD,判定ダイス5で近接攻撃の判定

・難易度
　KIDS=K,EASY=E,NORMAL=N,HARD=H,ULTRA HARD=UH 数字にも対応
MESSAGETEXT
  end

  def changeText(str)
    # roll difficults
    kids_pattern = /^(?:nj)(\d+)(?:@|\[)?[k2](?:\])?/i
    easy_pattern = /^(?:nj)(\d+)(?:@|\[)?[e3](?:\])?/i
    normal_pattern = /^(?:nj)(\d+)(?:@|\[)?[n4](?:\])?/i
    hard_pattern = /^(?:nj)(\d+)(?:@|\[)?[h5](?:\])?/i
    ultrahard_pattern = /^(?:nj)(\d+)(?:@|\[)?(?:uh|6)(?:\])?/i
    short_pattern = /^(?:nj)(\d+)$/i

    debug('src word: ', str)

    # NJ evaluate
    if (m = kids_pattern.match(str))
      debug('nj kids: ', str)
      m[1] + 'B6>=2'
    elsif (m = easy_pattern.match(str))
      debug('nj easy: ', str)
      m[1] + 'B6>=3'
    elsif (m = normal_pattern.match(str))
      debug('nj normal: ', str)
      m[1] + 'B6>=4'
    elsif (m = hard_pattern.match(str))
      debug('nj hard: ', str)
      m[1] + 'B6>=5'
    elsif (m = ultrahard_pattern.match(str))
      debug('nj ultrahard: ', str)
      m[1] + 'B6>=6'
    elsif (m = short_pattern.match(str))
      debug('nj short: ', str)
      m[1] + 'B6>=4'

    else
      debug('else: ', str)
      str
    end
  end

  def rollDiceCommand(command)
    debug('rollDiceCommand begin string', command)

    result = ''

    # ev roll difficults
    ev_kids_pattern = %r{^(?:ev)(\d+)(?:@|\[)?[k2](?:\])?(?:/)?(\d+)?}i
    ev_easy_pattern = %r{^(?:ev)(\d+)(?:@|\[)?[e3](?:\])?(?:/)?(\d+)?}i
    ev_normal_pattern = %r{^(?:ev)(\d+)(?:@|\[)?[n4](?:\])?(?:/)?(\d+)?}i
    ev_hard_pattern = %r{^(?:ev)(\d+)(?:@|\[)?[h5](?:\])?(?:/)?(\d+)?}i
    ev_ultrahard_pattern = %r{^(?:ev)(\d+)(?:@|\[)?(?:uh|6)(?:\])?(?:/)?(\d+)?}i
    ev_short_pattern = %r{^(?:ev)(\d+)(?:/)?(\d+)?$}i

    # combat attack difficults
    at_kids_pattern = /^(?:at)(\d+)(?:@|\[)?[k2](?:\])?/i
    at_easy_pattern = /^(?:at)(\d+)(?:@|\[)?[e3](?:\])?/i
    at_normal_pattern = /^(?:at)(\d+)(?:@|\[)?[n4](?:\])?/i
    at_hard_pattern = /^(?:at)(\d+)(?:@|\[)?[h5](?:\])?/i
    at_ultrahard_pattern = /^(?:at)(\d+)(?:@|\[)?(?:uh|6)(?:\])?/i
    at_short_pattern = /^(?:at)(\d+)$/i

    # EV evaluate
    if (m = ev_kids_pattern.match(command))
      debug('ev kids: ', command)

      dice_cnt = m[1]
      suc_rate ||= m[2]
      dice = roll(m[1], 6, 0, 0, '>=', 2)
      dice_str = dice[1]
      suc_cnt = dice[5]
      counter_karate = false

      if !suc_rate.nil? && suc_cnt > suc_rate.to_i
        debug('counter karate: true')
        counter_karate = true
      end

      result += "(#{m[1]}B6>=2) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if counter_karate
        result += ' ＞ カウンターカラテ!!'
      end

    elsif (m = ev_easy_pattern.match(command))
      debug('ev easy: ', command)

      dice_cnt = m[1]
      suc_rate ||= m[2]
      dice = roll(m[1], 6, 0, 0, '>=', 3)
      dice_str = dice[1]
      suc_cnt = dice[5]
      counter_karate = false

      if !suc_rate.nil? && suc_cnt > suc_rate.to_i
        debug('counter karate: true')
        counter_karate = true
      end

      result += "(#{m[1]}B6>=3) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if counter_karate
        result += ' ＞ カウンターカラテ!!'
      end
    elsif (m = ev_normal_pattern.match(command))
      debug('ev normal: ', command)

      dice_cnt = m[1]
      suc_rate ||= m[2]
      dice = roll(m[1], 6, 0, 0, '>=', 4)
      dice_str = dice[1]
      suc_cnt = dice[5]
      counter_karate = false

      if !suc_rate.nil? && suc_cnt > suc_rate.to_i
        debug('counter karate: true')
        counter_karate = true
      end

      result += "(#{m[1]}B6>=4) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if counter_karate
        result += ' ＞ カウンターカラテ!!'
      end
    elsif (m = ev_hard_pattern.match(command))
      debug('ev hard: ', command)

      dice_cnt = m[1]
      suc_rate ||= m[2]
      dice = roll(m[1], 6, 0, 0, '>=', 5)
      dice_str = dice[1]
      suc_cnt = dice[5]
      counter_karate = false

      if !suc_rate.nil? && suc_cnt > suc_rate.to_i
        debug('counter karate: true')
        counter_karate = true
      end

      result += "(#{m[1]}B6>=5) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if counter_karate
        result += ' ＞ カウンターカラテ!!'
      end
    elsif (m = ev_ultrahard_pattern.match(command))
      debug('ev ultrahard: ', command)

      dice_cnt = m[1]
      suc_rate ||= m[2]
      dice = roll(m[1], 6, 0, 0, '>=', 6)
      dice_str = dice[1]
      suc_cnt = dice[5]
      counter_karate = false

      if !suc_rate.nil? && suc_cnt > suc_rate.to_i
        debug('counter karate: true')
        counter_karate = true
      end

      result += "(#{m[1]}B6>=6) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if counter_karate
        result += ' ＞ カウンターカラテ!!'
      end
    elsif (m = ev_short_pattern.match(command))
      debug('ev short: ', command)

      dice_cnt = m[1]
      suc_rate ||= m[2]
      dice = roll(m[1], 6, 0, 0, '>=', 4)
      dice_str = dice[1]
      suc_cnt = dice[5]
      counter_karate = false

      if !suc_rate.nil? && suc_cnt > suc_rate.to_i
        debug('counter karate: true')
        counter_karate = true
      end

      result += "(#{m[1]}B6>=4) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if counter_karate
        result += ' ＞ カウンターカラテ!!'
      end

    # AT evaluate
    elsif (m = at_kids_pattern.match(command))
      debug('at kids: ', command)

      dice_cnt = m[1]
      dice = roll(m[1], 6, 0, 0, '>=', 2)
      dice_str = dice[1]
      suc_cnt = dice[5]
      satsubatsu = false

      six_cnt = dice[3]

      if six_cnt >= 2
        satsubatsu = true
      end

      result += "(#{dice_cnt}B6>=2) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if satsubatsu
        result += ' ＞ サツバツ!!'
      end
    elsif (m = at_easy_pattern.match(command))
      debug('at easy: ', command)

      dice_cnt = m[1]
      dice = roll(m[1], 6, 0, 0, '>=', 3)
      dice_str = dice[1]
      suc_cnt = dice[5]
      satsubatsu = false

      six_cnt = dice[3]

      if six_cnt >= 2
        satsubatsu = true
      end

      result += "(#{dice_cnt}B6>=3) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if satsubatsu
        result += ' ＞ サツバツ!!'
      end
    elsif (m = at_normal_pattern.match(command))
      debug('at normal: ', command)

      dice_cnt = m[1]
      dice = roll(m[1], 6, 0, 0, '>=', 4)
      dice_str = dice[1]
      suc_cnt = dice[5]
      satsubatsu = false

      six_cnt = dice[3]

      if six_cnt >= 2
        satsubatsu = true
      end

      result += "(#{dice_cnt}B6>=4) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if satsubatsu
        result += ' ＞ サツバツ!!'
      end
    elsif (m = at_hard_pattern.match(command))
      debug('at hard: ', command)

      dice_cnt = m[1]
      dice = roll(m[1], 6, 0, 0, '>=', 5)
      dice_str = dice[1]
      suc_cnt = dice[5]
      satsubatsu = false

      six_cnt = dice[3]

      if six_cnt >= 2
        satsubatsu = true
      end

      result += "(#{dice_cnt}B6>=5) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if satsubatsu
        result += ' ＞ サツバツ!!'
      end
    elsif (m = at_ultrahard_pattern.match(command))
      debug('at ultrahard: ', command)

      dice_cnt = m[1]
      dice = roll(m[1], 6, 0, 0, '>=', 6)
      dice_str = dice[1]
      suc_cnt = dice[5]
      satsubatsu = false

      six_cnt = dice[3]

      if six_cnt >= 2
        satsubatsu = true
      end

      result += "(#{dice_cnt}B6>=6) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if satsubatsu
        result += ' ＞ サツバツ!!'
      end
    elsif (m = at_short_pattern.match(command))
      debug('at short: ', command)

      dice_cnt = m[1]
      dice = roll(m[1], 6, 0, 0, '>=', 4)
      dice_str = dice[1]
      suc_cnt = dice[5]
      satsubatsu = false

      six_cnt = dice[3]

      if six_cnt >= 2
        satsubatsu = true
      end

      result += "(#{dice_cnt}B6>=4) ＞ #{dice_str} ＞ 成功数#{suc_cnt}"
      if satsubatsu
        result += ' ＞ サツバツ!!'
      end

    else
      debug('rollDiceCommand else: ', command)
      result = nil
    end

    return result
  end
end
