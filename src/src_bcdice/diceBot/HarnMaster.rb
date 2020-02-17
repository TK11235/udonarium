# -*- coding: utf-8 -*-

class HarnMaster < DiceBot
  setPrefixes(['SHK\d+.*', 'SLH', 'SLHU', 'SLHD'])

  def initialize
    super
  end

  def gameName
    'ハーンマスター'
  end

  def gameType
    "HarnMaster"
  end

  def getHelpMessage
    return <<MESSAGETEXT
・判定
　1D100<=XX の判定時に致命的失敗・決定的成功を判定
・ショック判定（SHKx）
　例）SHK13,3
・人型用　中段命中部位表 (SLH)／上段命中部位 (SLHU)／上段命中部位 (SLHD)
MESSAGETEXT
  end

  def check_1D100(total_n, _dice_n, signOfInequality, diff, _dice_cnt, _dice_max, _n1, _n_max)
    return '' unless signOfInequality == "<="

    result = getCheckResult(total_n, diff)
    return "＞ #{result}"
  end

  def getCheckResult(total, diff)
    return getFailResult(total) if total > diff

    return getSuccessResult(total)
  end

  def getFailResult(total)
    return "致命的失敗" if (total % 5) == 0

    return "失敗"
  end

  def getSuccessResult(total)
    return "決定的成功" if (total % 5) == 0

    return "成功"
  end

  def rollDiceCommand(command)
    result = nil

    case command
    when /^SHK(\d*),(\d+)/i
      toughness = Regexp.last_match(1).to_i
      damage = Regexp.last_match(2).to_i
      result = getCheckShockResult(damage, toughness)
    when /SLH(U|D)?/i
      type = Regexp.last_match(1)
      result = getStrikeLocationHuman(type)
    else
      result = nil
    end

    return result
  end

  def getCheckShockResult(damage, toughness)
    dice, diceText = roll(damage, 6)
    result = (dice <= toughness ? '成功' : '失敗')

    text = "ショック判定(ダメージ:#{damage}, 耐久力:#{toughness}) ＞ (#{dice}[#{diceText}]) ＞ #{result}"
    return text
  end

  def getStrikeLocationHuman(type)
    typeName = ''
    table = nil

    case type
    when 'U'
      typeName = "命中部位(人型 上段)"
      table = getStrikeLocationHumanUpperTable()
    when 'D'
      typeName = "命中部位(人型 下段)"
      table = getStrikeLocationHumanDownTable()
    when nil
      typeName = "命中部位(人型 中段)"
      table = getStrikeLocationHumanNormalTable()
    else
      raise "unknow atak type #{type}"
    end

    number, = roll(1, 100)
    part = get_table_by_number(number, table)
    part = getLocationSide(part, number)
    part = getFaceLocation(part)

    result = "#{typeName} ＞ (#{number})#{part}"

    return result
  end

  def getLocationSide(part, number)
    unless /^\*/ === part
      debug("part has NO side", part)
      return part
    end

    debug("part has side", part)

    side = (number.odd? ? "左" : "右")

    part.sub(/\*/, side)
  end

  def getFaceLocation(part)
    debug("getFaceLocation part", part)

    unless /\+$/ === part
      debug("is NOT Face")
      return part
    end

    debug("is Face")

    table = [
      [ 15, "顎"],
      [ 30, "*目"],
      [ 64, "*頬"],
      [ 80, "鼻"],
      [ 90, "*耳"],
      [100, "口"],
    ]

    number, = roll(1, 100)
    faceLocation = get_table_by_number(number, table)
    debug("faceLocation", faceLocation)
    debug("number", number)
    faceLocation = getLocationSide(faceLocation, number)

    result = part.sub(/\+$/, " ＞ (#{number})#{faceLocation}")
    return result
  end

  def getStrikeLocationHumanUpperTable()
    table = [
      [ 15, "頭部"],
      [ 30, "顔+"],
      [ 45, "首"],
      [ 57, "*肩"],
      [ 69, "*上腕"],
      [ 73, "*肘"],
      [ 81, "*前腕"],
      [ 85, "*手"],
      [ 95, "胸部"],
      [100, "腹部"],
    ]
    return table
  end

  def getStrikeLocationHumanNormalTable()
    table = [
      [ 5, "頭部"],
      [ 10, "顔+"],
      [ 15, "首"],
      [ 27, "*肩"],
      [ 33, "*上腕"],
      [ 35, "*肘"],
      [ 39, "*前腕"],
      [ 43, "*手"],
      [ 60, "胸部"],
      [ 70, "腹部"],
      [ 74, "股間"],
      [ 80, "*臀部"],
      [ 88, "*腿"],
      [ 90, "*膝"],
      [ 96, "*脛"],
      [100, "*足"],
    ]
    return table
  end

  def getStrikeLocationHumanDownTable()
    table = [
      [ 6, "*前腕"],
      [ 12, "*手"],
      [ 19, "胸部"],
      [ 29, "腹部"],
      [ 35, "股間"],
      [ 49, "*臀部"],
      [ 70, "*腿"],
      [ 78, "*膝"],
      [ 92, "*脛"],
      [100, "*足"],
    ]
    return table
  end
end
