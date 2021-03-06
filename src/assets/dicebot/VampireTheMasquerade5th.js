/* Generated by Opal 1.0.3 */
(function(Opal) {
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $truthy = Opal.truthy, $send = Opal.send;

  Opal.add_stubs(['$setPrefixes', '$match', '$[]', '$make_dice_roll', '$+', '$get_critical_success', '$to_i', '$>', '$>=', '$get_success_result', '$get_fail_result', '$<', '$==', '$*', '$floor', '$/', '$roll', '$each', '$split']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'VampireTheMasquerade5th');

    var $nesting = [self].concat($parent_nesting), $VampireTheMasquerade5th_rollDiceCommand$1, $VampireTheMasquerade5th_get_critical_success$2, $VampireTheMasquerade5th_make_dice_roll$3, $VampireTheMasquerade5th_get_success_result$5, $VampireTheMasquerade5th_get_fail_result$6;

    
    Opal.const_set($nesting[0], 'ID', "VampireTheMasquerade5th");
    Opal.const_set($nesting[0], 'NAME', "Vampire: The Masquerade 5th Edition");
    Opal.const_set($nesting[0], 'SORT_KEY', "うあんはいあさますかれえと5");
    Opal.const_set($nesting[0], 'HELP_MESSAGE', "" + "・判定コマンド(nVMFx+x)\n" + "  注意：難易度は必要成功数を表す\n" + "\n" + "  難易度指定：判定成功と失敗、Critical判定、\n" + "             （Hungerダイスがある場合）Messy CriticalとBestial Failureチェックを行う\n" + "  例) (難易度)VMF(ダイスプール)+(Hungerダイス)\n" + "      (難易度)VMF(ダイスプール)\n" + "\n" + "  難易度省略：判定失敗、Critical、（Hungerダイスがある場合）Bestial Failureチェックを行う\n" + "              判定成功、Messy Criticalのチェックを行わない\n" + "  例) VMF(ダイスプール)+(Hungerダイス)\n" + "      VMF(ダイスプール)\n" + "\n" + "  難易度0指定：全てのチェックを行わない\n" + "  例) 0VMF(ダイスプール)+(Hungerダイス)\n" + "      0VMF(ダイスプール)\n" + "\n");
    Opal.const_set($nesting[0], 'DIFFICULTY_INDEX', 1);
    Opal.const_set($nesting[0], 'DICE_POOL_INDEX', 3);
    Opal.const_set($nesting[0], 'HUNGER_DICE_INDEX', 5);
    Opal.const_set($nesting[0], 'NOT_CHECK_SUCCESS', -1);
    self.$setPrefixes(["\\d*VMF.*"]);
    
    Opal.def(self, '$rollDiceCommand', $VampireTheMasquerade5th_rollDiceCommand$1 = function $$rollDiceCommand(command) {
      var $a, $b, self = this, m = nil, dice_pool = nil, dice_text = nil, success_dice = nil, ten_dice = nil, result_text = nil, hunger_dice_pool = nil, hunger_dice_text = nil, hunger_success_dice = nil, hunger_ten_dice = nil, hunger_botch_dice = nil, difficulty = nil, judgment_result = nil;

      
      m = /^(\d+)?(VMF)(\d+)(\+(\d+))?/.$match(command);
      if ($truthy(m)) {
      } else {
        return ""
      };
      dice_pool = m['$[]']($$($nesting, 'DICE_POOL_INDEX'));
      $b = self.$make_dice_roll(dice_pool), $a = Opal.to_ary($b), (dice_text = ($a[0] == null ? nil : $a[0])), (success_dice = ($a[1] == null ? nil : $a[1])), (ten_dice = ($a[2] == null ? nil : $a[2])), $b;
      result_text = "" + "(" + (dice_pool) + "D10";
      hunger_dice_pool = m['$[]']($$($nesting, 'HUNGER_DICE_INDEX'));
      if ($truthy(hunger_dice_pool)) {
        
        $b = self.$make_dice_roll(hunger_dice_pool), $a = Opal.to_ary($b), (hunger_dice_text = ($a[0] == null ? nil : $a[0])), (hunger_success_dice = ($a[1] == null ? nil : $a[1])), (hunger_ten_dice = ($a[2] == null ? nil : $a[2])), (hunger_botch_dice = ($a[3] == null ? nil : $a[3])), $b;
        ten_dice = $rb_plus(ten_dice, hunger_ten_dice);
        success_dice = $rb_plus(success_dice, hunger_success_dice);
        result_text = "" + (result_text) + "+" + (hunger_dice_pool) + "D10) ＞ [" + (dice_text) + "]+[" + (hunger_dice_text) + "] ";
      } else {
        
        hunger_ten_dice = 0;
        hunger_botch_dice = 0;
        result_text = "" + (result_text) + ") ＞ [" + (dice_text) + "] ";
      };
      success_dice = $rb_plus(success_dice, self.$get_critical_success(ten_dice));
      difficulty = (function() {if ($truthy(m['$[]']($$($nesting, 'DIFFICULTY_INDEX')))) {
        return m['$[]']($$($nesting, 'DIFFICULTY_INDEX')).$to_i()
      } else {
        return $$($nesting, 'NOT_CHECK_SUCCESS')
      }; return nil; })();
      result_text = "" + (result_text) + " 成功数=" + (success_dice);
      if ($truthy($rb_gt(difficulty, 0))) {
        
        if ($truthy($rb_ge(success_dice, difficulty))) {
          judgment_result = self.$get_success_result($rb_ge(ten_dice, 2), hunger_ten_dice)
        } else {
          judgment_result = self.$get_fail_result(hunger_botch_dice)
        };
        result_text = "" + (result_text) + " 難易度=" + (difficulty) + (judgment_result);
      } else if ($truthy($rb_lt(difficulty, 0))) {
        
        if (success_dice['$=='](0)) {
          judgment_result = self.$get_fail_result(hunger_botch_dice)
        } else {
          judgment_result = ""
        };
        result_text = "" + (result_text) + (judgment_result);};
      return result_text;
    }, $VampireTheMasquerade5th_rollDiceCommand$1.$$arity = 1);
    
    Opal.def(self, '$get_critical_success', $VampireTheMasquerade5th_get_critical_success$2 = function $$get_critical_success(ten_dice) {
      var self = this;

      return $rb_times($rb_divide(ten_dice, 2).$floor(), 2)
    }, $VampireTheMasquerade5th_get_critical_success$2.$$arity = 1);
    
    Opal.def(self, '$make_dice_roll', $VampireTheMasquerade5th_make_dice_roll$3 = function $$make_dice_roll(dice_pool) {
      var $a, $b, $$4, self = this, _ = nil, dice_text = nil, success_dice = nil, ten_dice = nil, botch_dice = nil;

      
      $b = self.$roll(dice_pool, 10), $a = Opal.to_ary($b), (_ = ($a[0] == null ? nil : $a[0])), (dice_text = ($a[1] == null ? nil : $a[1])), $b;
      success_dice = 0;
      ten_dice = 0;
      botch_dice = 0;
      $send(dice_text.$split(","), 'each', [], ($$4 = function(take_dice){var self = $$4.$$s || this;

      
        
        if (take_dice == null) {
          take_dice = nil;
        };
        if ($truthy($rb_ge(take_dice.$to_i(), 6))) {
          
          success_dice = $rb_plus(success_dice, 1);
          if (take_dice['$==']("10")) {
            return (ten_dice = $rb_plus(ten_dice, 1))
          } else {
            return nil
          };
        } else if (take_dice['$==']("1")) {
          return (botch_dice = $rb_plus(botch_dice, 1))
        } else {
          return nil
        };}, $$4.$$s = self, $$4.$$arity = 1, $$4));
      return [dice_text, success_dice, ten_dice, botch_dice];
    }, $VampireTheMasquerade5th_make_dice_roll$3.$$arity = 1);
    
    Opal.def(self, '$get_success_result', $VampireTheMasquerade5th_get_success_result$5 = function $$get_success_result(is_critical, hunger_ten_dice) {
      var $a, self = this, judgment_result = nil;

      
      judgment_result = "：判定成功!";
      if ($truthy(($truthy($a = $rb_gt(hunger_ten_dice, 0)) ? is_critical : $a))) {
        return "" + (judgment_result) + " [Messy Critical]"
      } else if ($truthy(is_critical)) {
        return "" + (judgment_result) + " [Critical Win]"};
      return judgment_result;
    }, $VampireTheMasquerade5th_get_success_result$5.$$arity = 2);
    return (Opal.def(self, '$get_fail_result', $VampireTheMasquerade5th_get_fail_result$6 = function $$get_fail_result(hunger_botch_dice) {
      var self = this, judgment_result = nil;

      
      judgment_result = "：判定失敗!";
      if ($truthy($rb_gt(hunger_botch_dice, 0))) {
        return "" + (judgment_result) + " [Bestial Failure]"};
      return judgment_result;
    }, $VampireTheMasquerade5th_get_fail_result$6.$$arity = 1), nil) && 'get_fail_result';
  })($nesting[0], $$($nesting, 'DiceBot'), $nesting)
})(Opal);
