/* Generated by Opal 1.0.3 */
(function(Opal) {
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_le(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs <= rhs : lhs['$<='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send, $range = Opal.range;

  Opal.add_stubs(['$setPrefixes', '$upcase', '$===', '$last_match', '$[]', '$to_i', '$get_value', '$!', '$nil?', '$scan', '$each', '$get_roll_parameter', '$checkRoll', '$get_hit_table', '$get_SUV_table', '$get_damageEffect_table', '$get_critical_table', '$get_accident_table', '$get_mechanicAccident_table', '$get_strategyEvent_chart', '$get_NPCAttack_chart', '$get_loserDestiny_chart', '$get_randomEncounter_table', '$*', '$/', '$**', '$roll', '$getRollResultTextAndSuccesValue', '$+', '$>', '$>=', '$to_s', '$getFormulaText', '$include?', '$-', '$<=', '$==', '$<', '$get_MetalHeadExtream_1d10_table_result', '$index', '$to_a', '$each_with_index', '$first', '$get_table_by_number', '$get_roc_dice', '$get_MetalHeadExtream_1d100_table_result', '$get_MetalHeadExtream_1dX_table_result', '$to_f', '$=~']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'MetalHeadExtream');

    var $nesting = [self].concat($parent_nesting), $MetalHeadExtream_rollDiceCommand$1, $MetalHeadExtream_checkRoll$3, $MetalHeadExtream_get_roll_parameter$4, $MetalHeadExtream_getRollResultTextAndSuccesValue$5, $MetalHeadExtream_getFormulaText$6, $MetalHeadExtream_get_hit_table$7, $MetalHeadExtream_get_SUV_table$8, $MetalHeadExtream_get_damageEffect_table$10, $MetalHeadExtream_get_critical_table$12, $MetalHeadExtream_get_accident_table$13, $MetalHeadExtream_get_mechanicAccident_table$14, $MetalHeadExtream_get_strategyEvent_chart$15, $MetalHeadExtream_get_NPCAttack_chart$16, $MetalHeadExtream_get_loserDestiny_chart$17, $MetalHeadExtream_get_randomEncounter_table$18, $MetalHeadExtream_get_MetalHeadExtream_1d10_table_result$19, $MetalHeadExtream_get_MetalHeadExtream_1d100_table_result$20, $MetalHeadExtream_get_MetalHeadExtream_1dX_table_result$21, $MetalHeadExtream_get_roc_dice$22, $MetalHeadExtream_get_value$23;

    
    Opal.const_set($nesting[0], 'ID', "MetalHeadExtream");
    Opal.const_set($nesting[0], 'NAME', "メタルヘッドエクストリーム");
    Opal.const_set($nesting[0], 'SORT_KEY', "めたるへつとえくすとりいむ");
    Opal.const_set($nesting[0], 'HELP_MESSAGE', "" + "◆判定：ARn or SRn[*/a][@b][Ac][Ld][!M]　　[]内省略可。\n" + "「n」で判定値、「*/a」でロール修正を指定。複数回指定可。\n" + "「@b」でアクシデント値、省略時は「96」。\n" + "「Ac」で高度なロール。「2、4、8」のみ指定可能。\n" + "「Ld」でラックポイント、「!M」でパンドラ《ミューズ》。\n" + "\n" + "【書式例】\n" + "AR84/2@99!M → 判定値84のAR1/2。アクシデント値99、パンドラ《ミューズ》。\n" + "SR40*2A2L1@99 → 判定値80のSR、高度なロール2倍、ラック1点。\n" + "\n" + "◆命中部位表：(命中部位)HIT[n]　　以降、ROC時は[n]を指定。\n" + "HU：人間　　BK：バイク　　WA：ワゴン　　SC：シェルキャリア　　BG：バギー\n" + "IN：インセクター　　PT：ポケットタンク　　HT：ホバータンク　　TA：戦車\n" + "AC：装甲車　　HE：ヘリ　　TR：トレーラー　　VT：VTOL　　BO：ボート\n" + "CS：通常、格闘型コンバットシェル　　TH：可変、重コンバットシェル\n" + "AM：オートモビル　　GD：ガンドック　　HC：ホバークラフト\n" + "BI：自転車　　BT：バトルトレーラー　　AI：エアクラフト\n" + "◆戦闘結果表：SUV(A～Z)n　　【書式例】SUVM100\n" + "◆損傷効果表：(命中部位)DMG(損傷種別)　　【書式例】TDMGH\n" + "H：頭部　　T：胴部　　A：腕部　　L：脚部　　M：心理　　E：電子\n" + "B：メカニック本体　　P：パワープラント　　D：ドライブ\n" + "(損傷種別)　L：LW　　M：MW　　H：HW　　O：MO\n" + "◆クリティカル表：CRT[n]\n" + "◆アクシデント表：(種別)AC[n]\n" + "G：格闘　　S：射撃、投擲　　M：心理　　E：電子\n" + "◆メカニック事故表：(場所)MA[n][+m]　　「+m」で修正を指定。\n" + "A：空中　　S：水上、水中　　L：地上\n" + "\n" + "【マスコンバット】\n" + "ストラテジーイベントチャート：SEC\n" + "NPC攻撃処理チャート：NAC　　敗者運命チャート：LDC\n" + "\n" + "【各種表】\n" + "荒野ランダムエンカウント表：WENC[n]\n");
    self.$setPrefixes(["[AS]R\\d+.*", "(HU|BK|WA|SC|BG|IN|PT|HT|TA|AC|HE|TR|VT|BO|CS|TH|AM|GD|HC|BI|BT|AI)HIT\\d*", "SUV[A-Z]\\d+", "[HTALMEBPD]DMG[LMHO]", "CRT\\d*", "[GSME]AC\\d*", "[ASL]MA\\d*(\\+\\d+)?", "SEC", "NAC", "LDC", "[W]ENC\\d*"]);
    
    Opal.def(self, '$rollDiceCommand', $MetalHeadExtream_rollDiceCommand$1 = function $$rollDiceCommand(command) {
      var $a, $$2, self = this, text = nil, $case = nil, m = nil, type = nil, target = nil, modify = nil, paramText = nil, isMuse = nil, accidentValue = nil, advancedRoll = nil, luckPoint = nil, params = nil, hitPart = nil, roc = nil, armorGrade = nil, damage = nil, damageStage = nil, damageType = nil, locationType = nil, correction = nil;

      
      text = (function() {$case = command.$upcase();
      if (/([AS])R(\d+)(([\*\/]\d+)*)?(((@|A|L)\d+)*)(\!M)?$/i['$===']($case)) {
      m = $$($nesting, 'Regexp').$last_match();
      type = m['$[]'](1);
      target = m['$[]'](2).$to_i();
      modify = self.$get_value(1, m['$[]'](3));
      paramText = ($truthy($a = m['$[]'](5)) ? $a : "");
      isMuse = m['$[]'](8)['$nil?']()['$!']();
      accidentValue = 96;
      advancedRoll = 1;
      luckPoint = 0;
      params = paramText.$scan(/(.)(\d+)/);
      $send(params, 'each', [], ($$2 = function(marker, value){var self = $$2.$$s || this, $b, $c;

      
        
        if (marker == null) {
          marker = nil;
        };
        
        if (value == null) {
          value = nil;
        };
        return $c = self.$get_roll_parameter(accidentValue, advancedRoll, luckPoint, marker, value), $b = Opal.to_ary($c), (accidentValue = ($b[0] == null ? nil : $b[0])), (advancedRoll = ($b[1] == null ? nil : $b[1])), (luckPoint = ($b[2] == null ? nil : $b[2])), $c;}, $$2.$$s = self, $$2.$$arity = 2, $$2));
      return self.$checkRoll(type, target, modify, accidentValue, advancedRoll, luckPoint, isMuse);}
      else if (/(HU|BK|WA|SC|BG|IN|PT|HT|TA|AC|HE|TR|VT|BO|CS|TH|AM|GD|HC|BI|BT|AI)HIT(\d+)?/i['$===']($case)) {
      hitPart = $$($nesting, 'Regexp').$last_match(1);
      roc = ($truthy($a = $$($nesting, 'Regexp').$last_match(2)) ? $a : 0).$to_i();
      return self.$get_hit_table(hitPart, roc);}
      else if (/SUV([A-Z])(\d+)/i['$===']($case)) {
      armorGrade = $$($nesting, 'Regexp').$last_match(1);
      damage = $$($nesting, 'Regexp').$last_match(2).$to_i();
      return self.$get_SUV_table(armorGrade, damage);}
      else if (/([HTALMEBPD])DMG([LMHO])/i['$===']($case)) {
      hitPart = $$($nesting, 'Regexp').$last_match(1);
      damageStage = $$($nesting, 'Regexp').$last_match(2);
      return self.$get_damageEffect_table(hitPart, damageStage);}
      else if (/CRT(\d+)?/i['$===']($case)) {
      roc = ($truthy($a = $$($nesting, 'Regexp').$last_match(1)) ? $a : 0).$to_i();
      return self.$get_critical_table(roc);}
      else if (/([GSME])AC(\d+)?/i['$===']($case)) {
      damageType = $$($nesting, 'Regexp').$last_match(1);
      roc = ($truthy($a = $$($nesting, 'Regexp').$last_match(2)) ? $a : 0).$to_i();
      return self.$get_accident_table(damageType, roc);}
      else if (/([ASL])MA(\d+)?(\+(\d+))?/i['$===']($case)) {
      locationType = $$($nesting, 'Regexp').$last_match(1);
      roc = ($truthy($a = $$($nesting, 'Regexp').$last_match(2)) ? $a : 0).$to_i();
      correction = ($truthy($a = $$($nesting, 'Regexp').$last_match(4)) ? $a : 0).$to_i();
      return self.$get_mechanicAccident_table(locationType, roc, correction);}
      else if ("SEC"['$===']($case)) {return self.$get_strategyEvent_chart()}
      else if ("NAC"['$===']($case)) {return self.$get_NPCAttack_chart()}
      else if ("LDC"['$===']($case)) {return self.$get_loserDestiny_chart()}
      else if (/([W])ENC(\d+)?/i['$===']($case)) {
      locationType = $$($nesting, 'Regexp').$last_match(1);
      roc = ($truthy($a = $$($nesting, 'Regexp').$last_match(2)) ? $a : 0).$to_i();
      return self.$get_randomEncounter_table(locationType, roc);}
      else { return nil }})();
      return text;
    }, $MetalHeadExtream_rollDiceCommand$1.$$arity = 1);
    
    Opal.def(self, '$checkRoll', $MetalHeadExtream_checkRoll$3 = function $$checkRoll(rollText, target, modify, accidentValue, advancedRoll, luckPoint, isMuse) {
      var $a, $b, self = this, rollTarget = nil, dice = nil, resultText = nil, successValue = nil, complementText = nil, modifyText = nil, formulaText = nil, result = nil;

      
      rollTarget = $rb_times($rb_divide($rb_times(target, modify), advancedRoll), (2)['$**'](luckPoint)).$to_i();
      $b = self.$roll(1, 100), $a = Opal.to_ary($b), (dice = ($a[0] == null ? nil : $a[0])), $b;
      $b = self.$getRollResultTextAndSuccesValue(dice, advancedRoll, rollTarget, accidentValue, isMuse), $a = Opal.to_ary($b), (resultText = ($a[0] == null ? nil : $a[0])), (successValue = ($a[1] == null ? nil : $a[1])), $b;
      resultText = $rb_plus(resultText, "" + " 達成値：" + (successValue));
      complementText = "" + "ACC:" + (accidentValue);
      if ($truthy($rb_gt(advancedRoll, 1))) {
        complementText = $rb_plus(complementText, "" + ", ADV:*" + (advancedRoll))};
      if ($truthy($rb_gt(luckPoint, 0))) {
        complementText = $rb_plus(complementText, "" + ", LUC:" + (luckPoint))};
      if ($truthy($rb_ge(modify, 1))) {
        modifyText = modify.$to_i().$to_s()
      } else {
        modifyText = "" + "1/" + ($rb_divide(1, modify).$to_i())
      };
      formulaText = self.$getFormulaText(target, modify, advancedRoll, luckPoint);
      result = "" + (rollText) + "R" + (modifyText) + "(" + (complementText) + ")：1D100<=" + (rollTarget) + (formulaText) + " ＞ [" + (dice) + "] " + (resultText);
      if ($truthy(isMuse)) {
        result = $rb_plus(result, " 《ミューズ》")};
      return result;
    }, $MetalHeadExtream_checkRoll$3.$$arity = 7);
    
    Opal.def(self, '$get_roll_parameter', $MetalHeadExtream_get_roll_parameter$4 = function $$get_roll_parameter(accident, advanced, luck, marker, value) {
      var self = this, $case = nil;

      
      value = value.$to_i();
      $case = marker;
      if ("@"['$===']($case)) {accident = value}
      else if ("A"['$===']($case)) {if ($truthy([2, 4, 8]['$include?'](value))) {
        advanced = value}}
      else if ("L"['$===']($case)) {luck = value};
      return [accident, advanced, luck];
    }, $MetalHeadExtream_get_roll_parameter$4.$$arity = 5);
    
    Opal.def(self, '$getRollResultTextAndSuccesValue', $MetalHeadExtream_getRollResultTextAndSuccesValue$5 = function $$getRollResultTextAndSuccesValue(dice, advancedRoll, rollTarget, accidentValue, isMuse) {
      var self = this, successValue = nil, resultText = nil, dig1 = nil, isCritical = nil;

      
      successValue = 0;
      if ($truthy($rb_ge(dice, accidentValue))) {
        
        resultText = "失敗（アクシデント）";
        return [resultText, successValue];};
      if ($truthy($rb_gt(dice, rollTarget))) {
        
        resultText = "失敗";
        return [resultText, successValue];};
      dig1 = $rb_minus(dice, $rb_times($rb_divide(dice, 10).$to_i(), 10));
      if ($truthy(isMuse)) {
        isCritical = $rb_le(dig1, 1)
      } else {
        isCritical = dig1['$=='](1)
      };
      resultText = "成功";
      if ($truthy(isCritical)) {
        resultText = $rb_plus(resultText, "（クリティカル）")};
      successValue = $rb_times(dice, advancedRoll);
      return [resultText, successValue];
    }, $MetalHeadExtream_getRollResultTextAndSuccesValue$5.$$arity = 5);
    
    Opal.def(self, '$getFormulaText', $MetalHeadExtream_getFormulaText$6 = function $$getFormulaText(target, modify, advancedRoll, luckPoint) {
      var self = this, formulaText = nil;

      
      formulaText = target.$to_s();
      if ($truthy($rb_gt(modify, 1))) {
        formulaText = $rb_plus(formulaText, "" + "*" + (modify.$to_i()))};
      if ($truthy($rb_lt(modify, 1))) {
        formulaText = $rb_plus(formulaText, "" + "/" + ($rb_divide(1, modify).$to_i()))};
      if ($truthy($rb_gt(advancedRoll, 1))) {
        formulaText = $rb_plus(formulaText, "" + "/" + (advancedRoll))};
      if ($truthy($rb_gt(luckPoint, 0))) {
        formulaText = $rb_plus(formulaText, "" + "*" + ((2)['$**'](luckPoint)))};
      if (formulaText['$=='](target.$to_s())) {
        return ""};
      return "" + "[" + (formulaText) + "]";
    }, $MetalHeadExtream_getFormulaText$6.$$arity = 4);
    
    Opal.def(self, '$get_hit_table', $MetalHeadExtream_get_hit_table$7 = function $$get_hit_table(hitPart, roc) {
      var self = this, $case = nil, name = nil, table = nil;

      
      $case = hitPart;
      if ("HU"['$===']($case)) {
      name = "命中部位表：人間";
      table = [[1, "胴部（クリティカル）"], [2, "頭部"], [3, "左腕部"], [4, "右腕部"], [5, "胴部"], [6, "胴部"], [7, "胴部"], [8, "胴部"], [9, "脚部"], [10, "脚部"]];}
      else if ("BK"['$===']($case)) {
      name = "命中部位表：バイク";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "パワープラント"], [6, "ドライブ"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "乗員"], [10, "乗員"]];}
      else if ("WA"['$===']($case)) {
      name = "命中部位表：ワゴン";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "本体"], [7, "パワープラント"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("SC"['$===']($case)) {
      name = "命中部位表：シェルキャリア";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "本体"], [7, "パワープラント"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("BG"['$===']($case)) {
      name = "命中部位表：バギー";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("IN"['$===']($case)) {
      name = "命中部位表：インセクター";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "ドライブ"], [9, "ドライブ"], [10, "乗員"]];}
      else if ("PT"['$===']($case)) {
      name = "命中部位表：ポケットタンク";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "パワープラント"], [8, "ドライブ"], [9, "ドライブ"], [10, "兵装・貨物"]];}
      else if ("HT"['$===']($case)) {
      name = "命中部位表：ホバータンク";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "本体"], [7, "パワープラント"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "兵装・貨物"]];}
      else if ("TA"['$===']($case)) {
      name = "命中部位表：戦車";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "兵装・貨物"]];}
      else if ("AC"['$===']($case)) {
      name = "命中部位表：装甲車";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "兵装・貨物"]];}
      else if ("HE"['$===']($case)) {
      name = "命中部位表：ヘリ";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "パワープラント"], [6, "ドライブ"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("TR"['$===']($case)) {
      name = "命中部位表：トレーラー";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "パワープラント"], [6, "ドライブ"], [7, "兵装・カーゴ"], [8, "兵装・カーゴ"], [9, "兵装・カーゴ"], [10, "乗員"]];}
      else if ("VT"['$===']($case)) {
      name = "命中部位表：VTOL";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("BO"['$===']($case)) {
      name = "命中部位表：ボート";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "本体"], [7, "本体"], [8, "パワープラント"], [9, "ドライブ"], [10, "兵装・貨物"]];}
      else if ("CS"['$===']($case)) {
      name = "命中部位表：通常・格闘型コンバットシェル";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "本体"], [7, "ザック"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "兵装・貨物"]];}
      else if ("TH"['$===']($case)) {
      name = "命中部位表：可変・重コンバットシェル";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "本体"], [7, "ドライブ"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "兵装・貨物"]];}
      else if ("AM"['$===']($case)) {
      name = "命中部位表：オートモビル";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("GD"['$===']($case)) {
      name = "命中部位表：ガンドック";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "ドライブ"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("HC"['$===']($case)) {
      name = "命中部位表：ホバークラフト";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "パワープラント"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "乗員"], [10, "乗員"]];}
      else if ("BI"['$===']($case)) {
      name = "命中部位表：自転車";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("BT"['$===']($case)) {
      name = "命中部位表：バトルトレーラー";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else if ("AI"['$===']($case)) {
      name = "命中部位表：エアクラフト";
      table = [[1, "本体（クリティカル）"], [2, "本体"], [3, "本体"], [4, "本体"], [5, "本体"], [6, "パワープラント"], [7, "ドライブ"], [8, "兵装・貨物"], [9, "兵装・貨物"], [10, "乗員"]];}
      else {return nil};
      return self.$get_MetalHeadExtream_1d10_table_result(name, table, roc);
    }, $MetalHeadExtream_get_hit_table$7.$$arity = 2);
    
    Opal.def(self, '$get_SUV_table', $MetalHeadExtream_get_SUV_table$8 = function $$get_SUV_table(armorGrade, damage) {
      var $$9, self = this, name = nil, table = nil, armorIndex = nil, damageInfo = nil, woundRanks = nil, woundText = nil;

      
      name = "戦闘結果表";
      table = [[0, 1, 6, 16, 26, 36], [0, 1, 6, 26, 36, 46], [0, 1, 16, 26, 46, 56], [1, 6, 26, 36, 56, 76], [1, 16, 36, 46, 66, 76], [1, 26, 36, 56, 76, 86], [1, 36, 56, 66, 76, 96], [1, 56, 76, 86, 96, 106], [1, 66, 86, 96, 106, 116], [1, 66, 86, 96, 116, 136], [1, 76, 96, 106, 126, 156], [1, 76, 96, 116, 146, 166], [1, 86, 106, 126, 166, 176], [1, 106, 126, 136, 176, 196], [1, 106, 126, 146, 186, 206], [1, 116, 136, 156, 196, 206], [1, 126, 146, 166, 206, 226], [1, 126, 146, 176, 226, 246], [1, 136, 156, 186, 246, 266], [1, 156, 176, 206, 246, 286], [1, 156, 176, 206, 266, 306], [1, 166, 186, 206, 286, 346], [1, 176, 196, 246, 326, 366], [1, 196, 226, 266, 346, 386], [1, 206, 226, 286, 366, 406], [1, 226, 246, 306, 386, 406]];
      armorIndex = $range("A", "Z", false).$to_a().$index(armorGrade);
      damageInfo = table['$[]'](armorIndex);
      woundRanks = ["無傷", "LW(軽傷)", "MW(中傷)", "HW(重傷)", "MO(致命傷)", "KL(死亡)"];
      woundText = "";
      (function(){var $brk = Opal.new_brk(); try {return $send(damageInfo, 'each_with_index', [], ($$9 = function(rate, index){var self = $$9.$$s || this;

      
        
        if (rate == null) {
          rate = nil;
        };
        
        if (index == null) {
          index = nil;
        };
        if ($truthy($rb_gt(rate, damage))) {
          
          Opal.brk(nil, $brk)};
        return (woundText = woundRanks['$[]'](index));}, $$9.$$s = self, $$9.$$brk = $brk, $$9.$$arity = 2, $$9))
      } catch (err) { if (err === $brk) { return err.$v } else { throw err } }})();
      return "" + (name) + "(" + (armorGrade) + ")：" + (damage) + " ＞ " + (woundText);
    }, $MetalHeadExtream_get_SUV_table$8.$$arity = 2);
    
    Opal.def(self, '$get_damageEffect_table', $MetalHeadExtream_get_damageEffect_table$10 = function $$get_damageEffect_table(hitPart, damageStage) {
      var $$11, self = this, damageInfos = nil, index = nil, damageIndex = nil, damageText = nil, $case = nil, name = nil, table = nil, text = nil;

      
      damageInfos = [["L", "(LW)"], ["M", "(MW)"], ["H", "(HW)"], ["O", "(MO)"]];
      index = $send(damageInfos, 'index', [], ($$11 = function(i){var self = $$11.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        return i.$first()['$=='](damageStage);}, $$11.$$s = self, $$11.$$arity = 1, $$11));
      if (index['$=='](-1)) {
        return nil};
      damageIndex = $rb_plus(index, 1);
      damageText = damageInfos['$[]'](index)['$[]'](1);
      $case = hitPart;
      if ("H"['$===']($case)) {
      name = "対人損傷効果表：頭部";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正+10。【PER】のAR、【PER】がベースアビリティのスキルのSRにSR1/2のロール修正。"], [3, "ダメージ修正+20。【PER】のAR、【PER】がベースアビリティのスキルのSRにSR1/4のロール修正。"], [4, "ダメージ修正+30。［死亡］。頭部がサイバーの場合は［戦闘不能］。"]];}
      else if ("T"['$===']($case)) {
      name = "対人損傷効果表：胴部";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正+10。【DEX】のAR、【DEX】がベースアビリティのスキルのSRにSR1/2のロール修正。"], [3, "ダメージ修正+20。【DEX】のAR、【DEX】がベースアビリティのスキルのSRにSR1/4のロール修正。"], [4, "ダメージ修正+30。［戦闘不能］。"]];}
      else if ("A"['$===']($case)) {
      name = "対人損傷効果表：腕部";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正+10。損傷した腕を使用する、また両腕を使用する行動にSR1/2のロール修正。"], [3, "ダメージ修正+20。損傷した腕を使用する、また両腕を使用する行動にSR1/4のロール修正。"], [4, "ダメージ修正+30。損傷した腕を使用する、また両腕を使用する行動不可。"]];}
      else if ("L"['$===']($case)) {
      name = "対人損傷効果表：脚部";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正+10。【REF】のAR、【REF】がベースアビリティのスキルのSRにSR1/2のロール修正。"], [3, "ダメージ修正+20。【REF】のAR、【REF】がベースアビリティのスキルのSRにSR1/4のロール修正。【MV】が1/2。"], [4, "ダメージ修正+30。［戦闘不能］。"]];}
      else if ("M"['$===']($case)) {
      name = "心理損傷効果表";
      table = [[1, "ダメージ修正+10。焦り。効果は特になし。シーン終了で自然回復。"], [2, "ダメージ修正+20。混乱。1シーン、すべてのロールがSR1/2となる。シーン終了で自然回復。"], [3, "ダメージ修正+30。恐怖。1シーン、すべてのロールがSR1/4となる。シーン終了で自然回復。"], [4, "ダメージ修正+50。喪失。［戦闘不能］。シーン終了で自然回復。"]];}
      else if ("E"['$===']($case)) {
      name = "電子損傷効果表";
      table = [[1, "ダメージ修正+10。処理落ち。効果は特になし。"], [2, "ダメージ修正+20。ノイズ。1シーン、角色ならすべてのロールが、アイテムならそれを使用したロールが1/2となる。"], [3, "ダメージ修正+30。恐怖。1シーン、角色ならすべてのロールが、アイテムならそれを使用したロールが1/4となる。"], [4, "ダメージ修正+50。クラッシュ。角色なら［戦闘不能］。アイテムなら1シナリオ中、使用不可。"]];}
      else if ("B"['$===']($case)) {
      name = "メカニック損傷効果表：本体";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正シフト1。修理費がフレーム価格の1/4かかる。"], [3, "ダメージ修正シフト2。修理費がフレーム価格の1/2かかる。"], [4, "ダメージ修正シフト3。移動不能。修理費がフレーム価格と同じだけかかる。走行中なら事故表を振ること。"]];}
      else if ("P"['$===']($case)) {
      name = "メカニック損傷効果表：パワープラント";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正+10。メカニックの【MV】が1/2になる。修理費がパワープラント価格の1/4かかる。"], [3, "ダメージ修正+20。メカニックの【MV】が1/4になる。修理費がパワープラント価格の1/2かかる。"], [4, "ダメージ修正+30。移動不能。修理費がパワープラント価格と同じだけかかる。走行中なら事故表を振ること。"]];}
      else if ("D"['$===']($case)) {
      name = "メカニック損傷効果表：ドライブ";
      table = [[1, "ダメージ修正+10。"], [2, "ダメージ修正+10。メカニックの【REF】が1/2になる。［メカニック］スキルにSR1/2の修正。修理費がドライブ価格の1/4かかる。"], [3, "ダメージ修正+20。メカニックの【REF】が1/2になる。［メカニック］スキルにSR1/4の修正。修理費がドライブ価格の1/2かかる。"], [4, "ダメージ修正+30。移動不能。修理費がドライブ価格と同じだけかかる。走行中なら事故表を振ること。"]];}
      else {return nil};
      text = self.$get_table_by_number(damageIndex, table);
      return "" + (name) + (damageText) + " ＞ " + (text);
    }, $MetalHeadExtream_get_damageEffect_table$10.$$arity = 2);
    
    Opal.def(self, '$get_critical_table', $MetalHeadExtream_get_critical_table$12 = function $$get_critical_table(roc) {
      var self = this, name = nil, table = nil;

      
      name = "クリティカル表";
      table = [[1, "特に追加被害は発生しない。"], [2, "対象はバランスを崩す。クリンナッププロセスまで、対象は命中ロールにSR1/2のロール修正を受ける。"], [3, "対象に隙を作る。クリンナッププロセスまで、対象はリアクションにSR1/2のロール修正を受ける。"], [4, "激しい一撃。最終火力に+20してダメージを算出すること。"], [5, "多大なダメージ。最終火力に+20してダメージを算出すること。"], [6, "弱点に直撃。対象の装甲値を無視してダメージを算出すること。"], [7, "効果的な一撃。対象の受ける損傷段階をシフト1する。"], [8, "致命的な一撃。対象の受ける損傷段階をシフト2する。"], [9, "中枢に直撃。対象の【SUV】を3ランク低いものとしてダメージを算出する。"], [10, "中枢を破壊。対象の装甲値を無視し、【SUV】を3ランク低いものとしてダメージを算出する。"]];
      return self.$get_MetalHeadExtream_1d10_table_result(name, table, roc);
    }, $MetalHeadExtream_get_critical_table$12.$$arity = 1);
    
    Opal.def(self, '$get_accident_table', $MetalHeadExtream_get_accident_table$13 = function $$get_accident_table(damageType, roc) {
      var self = this, $case = nil, name = nil, table = nil;

      
      $case = damageType;
      if ("G"['$===']($case)) {
      name = "格闘アクシデント表";
      table = [[1, "体勢を崩す。その攻撃は失敗する。"], [2, "体勢を崩す。その攻撃は失敗する。"], [3, "体勢を崩す。その攻撃は失敗する。"], [4, "転倒。格闘回避と機動回避にSR1/4、【MV】が半分に。"], [5, "転倒。格闘回避と機動回避にSR1/4、【MV】が半分に。"], [6, "転倒。格闘回避と機動回避にSR1/4、【MV】が半分に。"], [7, "武器が足下（0m離れたところ）に落ちる。素手のときは何もなし。"], [8, "武器が足下（0m離れたところ）に落ちる。素手のときは何もなし。"], [9, "武器が5m離れたところに落ちる。素手のときは関係ない。"], [10, "使用武器が壊れ、1シーン使用不可。"]];}
      else if ("S"['$===']($case)) {
      name = "射撃／投擲アクシデント表";
      table = [[1, "ささいなミス。その攻撃は失敗する。"], [2, "ささいなミス。その攻撃は失敗する。"], [3, "ささいなミス。その攻撃は失敗する。"], [4, "射撃武器はジャム。投擲武器ならば武器が取り出せないなど、マイナーアクションを消費しなければその武器を使用できない。"], [5, "射撃武器はジャム。投擲武器ならば武器が取り出せないなど、マイナーアクションを消費しなければその武器を使用できない。"], [6, "射撃武器はジャム。投擲武器ならば武器が取り出せないなど、マイナーアクションを消費しなければその武器を使用できない。"], [7, "故障。メジャーアクションで【DEX】のSR1のロールに成功しなければ、その武器を使用できない。"], [8, "故障。メジャーアクションで【DEX】のSR1のロールに成功しなければ、その武器を使用できない。"], [9, "破壊。以後、その武器は使用できない。"], [10, "武器の暴発。固定火力100のダメージを、装甲値無視で武器を持っていた腕（両手なら両手）、または兵装・貨物に受ける。"]];}
      else if ("M"['$===']($case)) {
      name = "心理攻撃アクシデント表";
      table = [[1, "集中失敗。攻撃は失敗する。"], [2, "集中失敗。攻撃は失敗する。"], [3, "集中失敗。攻撃は失敗する。"], [4, "思考ノイズ。クリンナップまですべてのリアクションにSR1/2。"], [5, "思考ノイズ。クリンナップまですべてのリアクションにSR1/2。"], [6, "思考ノイズ。クリンナップまですべてのリアクションにSR1/2。"], [7, "EXの暴走。頭部に装甲値無視、固定火力60のダメージを受ける。"], [8, "EXの暴走。頭部に装甲値無視、固定火力60のダメージを受ける。"], [9, "感情暴走。攻撃に使用したマニューバが1シーン使用不可。"], [10, "トラウマの再現。装甲値無視、固定火力100の心理ダメージを受ける。"]];}
      else if ("E"['$===']($case)) {
      name = "電子攻撃アクシデント表";
      table = [[1, "ショック。攻撃は失敗する。"], [2, "ショック。攻撃は失敗する。"], [3, "ショック。攻撃は失敗する。"], [4, "ノイズ発生。クリンナップまで電子攻撃のリアクションにSR1/2。"], [5, "ノイズ発生。クリンナップまで電子攻撃のリアクションにSR1/2。"], [6, "ノイズ発生。クリンナップまで電子攻撃のリアクションにSR1/2。"], [7, "ソフトウェア障害。攻撃に使用したソフトが1シーン使用不可。"], [8, "ソフトウェア障害。攻撃に使用したソフトが1シーン使用不可。"], [9, "ハードウェア障害。装甲値無視、固定火力80の電子ダメージを受ける。"], [10, "信号逆流。装甲値無視、固定火力100の心理ダメージを受ける。"]];}
      else {return nil};
      return self.$get_MetalHeadExtream_1d10_table_result(name, table, roc);
    }, $MetalHeadExtream_get_accident_table$13.$$arity = 2);
    
    Opal.def(self, '$get_mechanicAccident_table', $MetalHeadExtream_get_mechanicAccident_table$14 = function $$get_mechanicAccident_table(locationType, roc, correction) {
      var self = this, $case = nil, name = nil, table = nil, dice = nil, diceText = nil, tableText = nil, text = nil;

      
      $case = locationType;
      if ("A"['$===']($case)) {
      name = "空中メカニック事故表";
      table = [[3, "兵装／貨物。メカニックが装備している一番ENCの大きい武器ひとつが戦闘終了時まで使用不能になる。武器がない場合はメカニックオプションが使用不能になり、それもない場合は一番ENCの重い貨物（乗客をのぞく）が失われる。"], [6, "操作不能。メカニック本体にMWダメージ。操縦者は適切な［メカニック］スキルでSR1/4のロールを行い、成功したら体勢を立て直せる。失敗した場合、次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。"], [8, "不時着。メカニック本体にHWダメージ。次のクリンナッププロセスまで、回復をふくめた一切の行動を取ることができない。"], [9, "墜落。メカニック本体にMOダメージ。すべての乗員は、墜落のショックによってランダムな部位に〈物〉155の固定ダメージを受ける。このダメージは機動回避可能である。"], [10, "爆発。メカニックが爆発し、完全に破壊される。すべての乗員は、爆発と落下によって胴体に〈熱〉205の固定ダメージを受ける。このダメージは機動回避可能だが、SRに1/4の修正がある。"]];}
      else if ("S"['$===']($case)) {
      name = "水上／水中メカニック事故表";
      table = [[3, "横揺れ。次のクリンナッププロセスまで、このメカニックに乗っている角色の行うすべての［メカニック］ロールに1/2の修正が与えられる。"], [6, "兵装／貨物。メカニックが装備している一番ENCの大きい武器ひとつが戦闘終了時まで使用不能になる。武器がない場合はメカニックオプションが使用不能になり、それもない場合は一番ENCの重い貨物（乗客をのぞく）が失われる。"], [8, "横転。メカニック本体にMWダメージ。操縦者は適切な［メカニック］スキルでSR1/4のロールを行い、成功したら体勢を立て直せる。失敗した場合、次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。"], [9, "激突。メカニック本体に〈物〉255の固定ダメージ。"], [10, "爆発。メカニックが爆発し、完全に破壊される。すべての乗員は、爆発によって胴体に〈熱〉155の固定ダメージを受ける。このダメージは機動回避可能だが、SRに1/4の修正がある。"]];}
      else if ("L"['$===']($case)) {
      name = "地上メカニック事故表";
      table = [[3, "接触。メカニック本体にLWダメージ。"], [6, "兵装／貨物。メカニックが装備している一番ENCの大きい武器ひとつが戦闘終了時まで使用不能になる。武器がない場合はメカニックオプションが使用不能になり、それもない場合は一番ENCの重い貨物（乗客をのぞく）が失われる。"], [8, "スピン。メカニック本体にMWダメージ。操縦者は適切な［メカニック］スキルでSR1/4のロールを行い、成功したら体勢を立て直せる。失敗した場合、次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。"], [9, "激突。メカニック本体に〈物〉255の固定ダメージ。次のクリンナッププロセスまで、回避をふくめた一切の行動を取ることができない。"], [10, "爆発。メカニックが爆発し、完全に破壊される。すべての乗員は、爆発によって胴体に〈熱〉155の固定ダメージを受ける。このダメージは機動回避可能だが、SRに1/4の修正がある。"]];}
      else {return nil};
      dice = self.$get_roc_dice(roc, 10);
      diceText = dice.$to_s();
      dice = $rb_plus(dice, correction);
      if ($truthy($rb_gt(dice, 10))) {
        dice = 10};
      if ($truthy($rb_gt(correction, 0))) {
        diceText = "" + (dice) + "[" + (diceText) + "+" + (correction) + "]"};
      tableText = self.$get_table_by_number(dice, table);
      text = "" + (name) + "(" + (diceText) + ") ＞ " + (tableText);
      return text;
    }, $MetalHeadExtream_get_mechanicAccident_table$14.$$arity = 3);
    
    Opal.def(self, '$get_strategyEvent_chart', $MetalHeadExtream_get_strategyEvent_chart$15 = function $$get_strategyEvent_chart() {
      var self = this, name = nil, table = nil;

      
      name = "ストラテジーイベントチャート";
      table = [[50, "特に何事もなかった。"], [53, "スコール。種別：レーザーを装備している部隊の戦力はこのターン半減する。この効果は重複しない。"], [55, "ただよう不安。味方ユニットはWILのAR1を行い、失敗すると士気の10%を失う。"], [57, "狙撃！　司令官角色は胴体に〈物〉155点の固定ダメージを受ける。機動回避は可能。"], [60, "敵の猛烈な反撃！　味方ユニットはREFのAR1を行い、失敗するとこのターン、移動力がマイナス1。"], [63, "敵弾幕の隙を見いだす。このターン、味方ユニットは突破判定がSR2に。"], [65, "突破のチャンス。このターン、味方ユニットは移動力が1点上昇する。"], [67, "士気高揚。味方ユニットの士気がそれぞれ現在値の10%だけ回復する。"], [70, "敵陣崩壊。敵ユニットの中で士気がもっとも低いユニットが戦場から撤退する。複数いた場合、すべて撤退。PC、ゲストには効果なし。"], [73, "大声援。戦闘がどこかのハッカーによって衛星中継され、喝采を浴びる。"], [75, "雨／雪。種別；レーザーを部隊の戦力はこのターン半減する。この効果は重複しない。"], [77, "磁気嵐。このターン、種別：ミサイルは戦力に数えず、突撃に使用することもできない。"], [80, "膠着した戦況。このターン、味方ユニットは突破判定がSR1/2に。"], [83, "メタルホッパー！　金属イナゴの襲来で視界をふさがれ、このラウンドは全てのMC射程が0となる。"], [85, "大竜巻！　飛行しているユニットの移動力は0となり、飛行ユニットはこのターン自分から突撃を行えない。"], [87, "通信の混乱。味方ユニットはINTのAR1を行い、失敗するとこのターン、移動力がマイナス1。"], [90, "幸運が微笑む。味方ユニットのラックポイントが1点ずつ回復。NPCには無効。"], [93, "致命的な狙撃！　司令官角色は胴体に〈物〉205点の固定ダメージを受ける。機動回避は可能。"], [95, "敵の罠に落ちた。このターン、敵軍ユニットは移動力が1点上昇する。"], [97, "勝利の予感。味方ユニットの士気がそれぞれの現在値の20%だけ回復する。"], [99, "天変地異が襲いかかる！　このターン、すべてのユニットは移動できない。"], [100, "大混乱。後2回振る。"]];
      return self.$get_MetalHeadExtream_1d100_table_result(name, table, 0);
    }, $MetalHeadExtream_get_strategyEvent_chart$15.$$arity = 0);
    
    Opal.def(self, '$get_NPCAttack_chart', $MetalHeadExtream_get_NPCAttack_chart$16 = function $$get_NPCAttack_chart() {
      var self = this, name = nil, table = nil;

      
      name = "NPC攻撃処理チャート";
      table = [[5, "戦力の低い側だけが一方的に除去される。"], [8, "双方、一番戦力の少ないユニットひとつを除去する。"], [10, "戦力の高い側が最大戦力のユニットひとつを除去する。"]];
      return self.$get_MetalHeadExtream_1d10_table_result(name, table, 0);
    }, $MetalHeadExtream_get_NPCAttack_chart$16.$$arity = 0);
    
    Opal.def(self, '$get_loserDestiny_chart', $MetalHeadExtream_get_loserDestiny_chart$17 = function $$get_loserDestiny_chart() {
      var self = this, name = nil, table = nil;

      
      name = "敗者運命チャート";
      table = [[1, "奇跡的に無傷で生き延びた。いずれ復讐の機会もあるだろう。"], [2, "ランダムな部位にLWを負う。"], [3, "戦力決定に使っていた武器が破壊される。"], [4, "ランダムな部位にMWを負う。"], [5, "外見に影響するような傷を負う。治療するなら$3000。"], [6, "ランダムな部位にHWを負う。"], [7, "着用している防具すべてが破壊される。衣服は壊れない。"], [8, "ランダムな部位にMOを負う。"], [9, "ランダムに決定した能力値ひとつを、永久に1点失う。"], [10, "残念ながら、君は死んでしまった。"]];
      return self.$get_MetalHeadExtream_1d10_table_result(name, table, 0);
    }, $MetalHeadExtream_get_loserDestiny_chart$17.$$arity = 0);
    
    Opal.def(self, '$get_randomEncounter_table', $MetalHeadExtream_get_randomEncounter_table$18 = function $$get_randomEncounter_table(locationType, roc) {
      var self = this, $case = nil, name = nil, table = nil;

      
      $case = locationType;
      if ("W"['$===']($case)) {
      name = "荒野ランダムエンカウント表";
      table = [[80, "特に遭遇は発生しなかった"], [85, "1d10名のバンデッド"], [87, "ヴェーダ・バウンサー1名に率いられた1d10+2（最低1）のヴェーダ・ソルジャー"], [89, "1d10+2体のウェーブコヨーテ"], [91, "1d10÷2体（最低1）のレーザーアント"], [93, "1d10-5体（最低1）のライトニングホーク"], [96, "1d10体のメタルホッパー"], [98, "1体のブラスビースト"], [100, "1d10÷3体（最低1）のサンドワーム"]];}
      else {return nil};
      return self.$get_MetalHeadExtream_1d100_table_result(name, table, roc);
    }, $MetalHeadExtream_get_randomEncounter_table$18.$$arity = 2);
    
    Opal.def(self, '$get_MetalHeadExtream_1d10_table_result', $MetalHeadExtream_get_MetalHeadExtream_1d10_table_result$19 = function $$get_MetalHeadExtream_1d10_table_result(name, table, roc) {
      var self = this;

      return self.$get_MetalHeadExtream_1dX_table_result(name, table, roc, 10)
    }, $MetalHeadExtream_get_MetalHeadExtream_1d10_table_result$19.$$arity = 3);
    
    Opal.def(self, '$get_MetalHeadExtream_1d100_table_result', $MetalHeadExtream_get_MetalHeadExtream_1d100_table_result$20 = function $$get_MetalHeadExtream_1d100_table_result(name, table, roc) {
      var self = this;

      return self.$get_MetalHeadExtream_1dX_table_result(name, table, roc, 100)
    }, $MetalHeadExtream_get_MetalHeadExtream_1d100_table_result$20.$$arity = 3);
    
    Opal.def(self, '$get_MetalHeadExtream_1dX_table_result', $MetalHeadExtream_get_MetalHeadExtream_1dX_table_result$21 = function $$get_MetalHeadExtream_1dX_table_result(name, table, roc, diceMax) {
      var self = this, dice = nil, text = nil;

      
      dice = self.$get_roc_dice(roc, diceMax);
      text = self.$get_table_by_number(dice, table);
      return "" + (name) + "(" + (dice) + ") ＞ " + (text);
    }, $MetalHeadExtream_get_MetalHeadExtream_1dX_table_result$21.$$arity = 4);
    
    Opal.def(self, '$get_roc_dice', $MetalHeadExtream_get_roc_dice$22 = function $$get_roc_dice(roc, diceMax) {
      var $a, $b, self = this, dice = nil;

      
      dice = roc;
      if ($truthy($rb_gt(dice, diceMax))) {
        dice = diceMax};
      if (dice['$=='](0)) {
        $b = self.$roll(1, diceMax), $a = Opal.to_ary($b), (dice = ($a[0] == null ? nil : $a[0])), $b};
      return dice;
    }, $MetalHeadExtream_get_roc_dice$22.$$arity = 2);
    return (Opal.def(self, '$get_value', $MetalHeadExtream_get_value$23 = function $$get_value(originalValue, calculateText) {
      var $a, $$24, self = this, result = nil, calculateArray = nil;

      
      result = originalValue.$to_f();
      calculateArray = ($truthy($a = calculateText) ? $a : "").$scan(/[\*\/]\d*/);
      $send(calculateArray, 'each', [], ($$24 = function(i){var self = $$24.$$s || this;

      
        
        if (i == null) {
          i = nil;
        };
        i['$=~'](/([\*\/])(\d*)/i);
        if ($$($nesting, 'Regexp').$last_match(1)['$==']("*")) {
          result = $rb_times(result, $$($nesting, 'Regexp').$last_match(2).$to_i())};
        if ($$($nesting, 'Regexp').$last_match(1)['$==']("/")) {
          return (result = $rb_divide(result, $$($nesting, 'Regexp').$last_match(2).$to_i()))
        } else {
          return nil
        };}, $$24.$$s = self, $$24.$$arity = 1, $$24));
      return result;
    }, $MetalHeadExtream_get_value$23.$$arity = 2), nil) && 'get_value';
  })($nesting[0], $$($nesting, 'DiceBot'), $nesting)
})(Opal);
