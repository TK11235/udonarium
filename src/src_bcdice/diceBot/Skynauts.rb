# -*- coding: utf-8 -*-
# frozen_string_literal: true

class Skynauts < DiceBot
  # ゲームシステムの識別子
  ID = 'Skynauts'

  # ゲームシステム名
  NAME = '歯車の塔の探空士'

  # ゲームシステム名の読みがな
  SORT_KEY = 'すかいのおつ'

  # ダイスボットの使い方
  HELP_MESSAGE = <<MESSAGETEXT
◆判定　(SNn)、(2D6<=n)　n:目標値（省略時:7）
　例）SN5　SN5　SN(3+2)
◆航行チェック　(NV+n)　n:修正値（省略時:0）
　例）NV　NV+1
◆ダメージチェック　(Dx/y@m)　x:ダメージ左側の値、y:ダメージ右側の値
　m:《弾道学》（省略可）上:8、下:2、左:4、右:6
　飛空艇シート外の座標は()が付きます。
　例） D/4　D19/2　D/3@8　D[大揺れ]/2
◆砲撃判定+ダメージチェック　(BOMn/Dx/y@m)　n:目標値（省略時:7）
　x:ダメージ左側の値、y:ダメージ右側の値
　m:《弾道学》（省略可）上:8、下:2、左:4、右:6
　例） BOM/D/4　BOM9/D19@4
◆《回避運動》　(AVOn@mXX)　n:目標値（省略時:7）
　m:回避方向。上:8、下:2、左:4、右:6、XX：ダメージチェック結果
　例）
　AVO9@8[縦1,横4],[縦2,横6],[縦3,横8]　AVO@2[縦6,横4],[縦2,横6]
MESSAGETEXT

  setPrefixes(['D.*', '2[Dd]6<=.*', 'SN.*', 'NV.*', 'AVO.*', 'BOM.*'])

  def initialize
    super
    @fractionType = "omit"; # 端数の処理 ("omit"=切り捨て, "roundUp"=切り上げ, "roundOff"=四捨五入)
  end

  def rollDiceCommand(command)
    debug("\n=======================================\n")
    debug("rollDiceCommand command", command)

    # 通常判定
    result = getJudgeResult(command)
    return result unless result.nil?

    # 航行チェック
    result = navigationResult(command)
    return result unless result.nil?

    # ダメージチェック
    result = getFireResult(command)
    return result unless result.nil?

    # 砲撃判定+ダメージチェック
    result = getBomberResult(command)
    return result unless result.nil?

    # 回避運動(操舵判定含む)
    result = getAvoidResult(command)
    return result unless result.nil?

    debug("rollCommand result")
    return nil
  end

  def getJudgeResult(command)
    return nil unless (m = (/^2D6<=(\d)$/i.match(command) || /^SN(\d*)$/i.match(command)))

    debug("====getJudgeResult====")

    target = m[1].empty? ? 7 : m[1].to_i # 目標値。省略時は7
    debug("目標値", target)

    total, diceText, = roll(2, 6)

    if total <= 2
      result = "ファンブル"
    elsif total <= target
      result = "成功"
    else
      result = "失敗"
    end

    text = "(2D6<=#{target}) ＞ #{total}[#{diceText}] ＞ #{total} ＞ #{result}"

    return text
  end

  def navigationResult(command)
    return nil unless (m = /^NV(\+(\d+))?$/.match(command))

    debug("====navigationResult====")

    bonus = m[2].to_i # 〈操舵室〉の修正。GMの任意修正にも対応できるように(マイナスは無視)
    debug("移動修正", bonus)

    total, = roll(1, 6)
    # movePointBase = (total / 2) <= 0 ? 1 : (total / 2)
    movePointBase = (total / 2).floor <= 0 ? 1 : (total / 2).floor # TKfix Rubyでは常に整数が返るが、JSだと実数になる可能性がある
    movePoint = movePointBase + bonus
    debug("移動エリア数", movePoint)

    text = "航行チェック(最低1)　(1D6/2+#{bonus}) ＞ #{total} /2+#{bonus} ＞ "
    text += "#{movePointBase}+#{bonus} ＞ #{movePoint}エリア進む"

    return text
  end

  DIRECTION_INFOS = {
    1 => {:name => "左下", :position_diff => {:x => -1, :y => +1}},
    2 => {:name => "下", :position_diff => {:x => 0, :y => +1}},
    3 => {:name => "右下", :position_diff => {:x => +1, :y => +1}},
    4 => {:name => "左",   :position_diff => {:x => -1, :y =>  0}},
    # 5 は中央。算出する意味がないので対象外
    6 => {:name => "右",   :position_diff => {:x => +1, :y =>  0}},
    7 => {:name => "左上", :position_diff => {:x => -1, :y => -1}},
    8 => {:name => "上", :position_diff => {:x => 0, :y => -1}},
    9 => {:name => "右上", :position_diff => {:x => +1, :y => -1}},
  }.freeze

  def getDirectionInfo(direction, key, defaultValue = nil)
    info = DIRECTION_INFOS[direction.to_i]
    return defaultValue if info.nil?

    return info[key]
  end

  def getFireResult(command)
    return nil unless (m = %r{^D([12346789]*)(\[.+\])*/(\d+)(@([2468]))?$}.match(command))

    debug("====getFireResult====")

    fireCount = m[3].to_i # 砲撃回数
    fireRange = m[1].to_s # 砲撃範囲
    ballistics = m[5].to_i # 《弾道学》
    debug("fireCount", fireCount)
    debug("fireRange", fireRange)
    debug("ballistics", ballistics)

    fireCountMax = 25
    fireCount = [fireCount, fireCountMax].min

    firePoint = getFirePoint(fireRange, fireCount) # 着弾座標取得（3次元配列）
    fireText = getFirePointText(firePoint, fireCount) # 表示用文字列作成

    if ballistics != 0 # 《弾道学》有
      fireText += " ＞ 《弾道学》:"
      fireText += getDirectionInfo(ballistics, :name, "")
      fireText += "\n ＞ "
      fireText += getFirePointText(firePoint, fireCount, ballistics)
    end

    text = "#{command} ＞ #{fireText}"

    return text
  end

  def getFirePoint(fireRange, fireCount)
    debug("====getFirePoint====")

    firePoint = []

    fireCount.times do |count|
      debug("\n砲撃回数", count + 1)

      firePoint << []

      yPos, = roll(1, 6)  # 縦
      xPos, = roll(2, 6)  # 横
      position = [xPos, yPos]

      firePoint[-1] << position

      debug("着弾点", firePoint)

      fireRange.split(//).each do |rangeText|
        debug("範囲", rangeText)

        position_diff = getDirectionInfo(rangeText, :position_diff, {})
        position = [xPos + position_diff[:x].to_i, yPos + position_diff[:y].to_i]

        firePoint[-1] << position
        debug("着弾点:範囲", firePoint)
      end
    end

    debug("\n最終着弾点", firePoint)

    return firePoint
  end

  def getFirePointText(firePoint, _fireCount, direction = 0)
    debug("====getFirePointText====")

    fireTextList = []
    firePoint.each do |point|
      text = ""
      point.each do |x, y|
        # 《弾道学》《回避運動》などによる座標移動
        x, y = getMovePoint(x, y, direction)

        # マップ外の座標は括弧を付ける
        text += (isInMapPosition(x, y) ? "[縦#{y},横#{x}]" : "([縦#{y},横#{x}])")
        debug("着弾点テキスト", text)
      end

      fireTextList << text
    end

    fireText = fireTextList.join(",")

    debug("\n最終着弾点テキスト", fireText)
    return fireText
  end

  def isInMapPosition(x, y)
    ((1 <= y) && (y <= 6)) && ((2 <= x) && (x <= 12))
  end

  def getMovePoint(x, y, direction)
    debug("====getMovePoint====")
    debug("方向", direction)
    debug("座標移動前x", x)
    debug("座標移動前y", y)

    position_diff = getDirectionInfo(direction, :position_diff, {})
    x += position_diff[:x].to_i
    y += position_diff[:y].to_i

    debug("\n座標移動後x", x)
    debug("座標移動後y", y)
    return x, y
  end

  def getBomberResult(command)
    return nil unless (m = %r{^BOM(\d*)?/D([12346789]*)(\[.+\])*/(\d+)(@([2468]))?$}i.match(command))

    debug("====getBomberResult====", command)

    target = m[1].to_s
    direction = m[6].to_i
    debug("弾道学方向", direction)

    text = "#{command} ＞ "
    text += getJudgeResult("SN" + target) # 砲撃判定

    return text unless /成功/ === text

    # ダメージチェック部分
    fireCommand = command.slice(%r{D([12346789]*)(\[.+\])*/(\d+)(@([2468]))?})

    text += "\n ＞ #{getFireResult(fireCommand)}"

    return text
  end

  def getAvoidResult(command)
    return nil unless (m = /^AVO(\d*)?(@([2468]))(\(?\[縦\d+,横\d+\]\)?,?)+$/.match(command))

    debug("====getAvoidResult====", command)

    direction = m[3].to_i
    debug("回避方向", direction)

    judgeCommand = command.slice(/^AVO(\d*)?(@([2468]))/) # 判定部分
    text = "#{judgeCommand} ＞ 《回避運動》"
    text += getJudgeResult("SN" + Regexp.last_match(1).to_s) # 操舵判定

    return text unless /成功/ === text

    pointCommand = command.slice(/(\(?\[縦\d+,横\d+\]\)?,?)+/) # 砲撃座標

    firePoint = scanFirePoints(pointCommand)
    fireCount = firePoint.size

    text += "\n ＞ #{pointCommand}"
    text += " ＞ 《回避運動》:"
    text += getDirectionInfo(direction, :name, "")
    text += "\n ＞ "
    text += getFirePointText(firePoint, fireCount, direction)

    return text
  end

  def scanFirePoints(command)
    debug("====scanFirePoints====", command)

    command = command.gsub(/\(|\)/, "") # 正規表現が大変なので最初に括弧を外しておく

    firePoint = []

    # 一組ずつに分ける("[縦y,横xの単位)
    command.split(/\],/).each do |pointText|
      debug("pointText", pointText)

      firePoint << []

      # D以外の砲撃範囲がある時に必要
      pointText.split(/\]/).each do |point|
        debug("point", point)

        firePoint[-1] << []

        next unless /[^\d]*(\d+),[^\d]*(\d+)/ === point

        y = Regexp.last_match(1).to_i
        x = Regexp.last_match(2).to_i

        firePoint[-1][-1] = [x, y]

        debug("着弾点", firePoint)
      end
    end

    return firePoint
  end
end
