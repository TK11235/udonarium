/* Generated by Opal 1.0.3 */
(function(Opal) {
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  function $rb_divide(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs / rhs : lhs['$/'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_times(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs * rhs : lhs['$*'](rhs);
  }
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_ge(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs >= rhs : lhs['$>='](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $$$ = Opal.const_get_qualified, $$ = Opal.const_get_relative, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy, $hash2 = Opal.hash2;

  Opal.add_stubs(['$freeze', '$attr_reader', '$map', '$to_proc', '$join', '$private', '$clearPrefixes', '$!', '$empty?', '$prefixs', '$prefixes', '$class', '$warn', '$id', '$setPrefixes', '$attr_accessor', '$name', '$sort_key', '$help_message', '$attr_writer', '$rand', '$roll', '$marshalSignOfInequality', '$unlimitedRollDiceType', '$getD66Value', '$parren_killer', '$debug', '$isGetOriginalMessage', '$getOriginalMessage', '$=~', '$prefixesPattern', '$last_match', '$removeDiceCommandMessage', '$rollDiceCommandCatched', '$nil?', '$!=', '$sub', '$rollDiceCommand', '$to_s', '$backtrace', '$size', '$===', '$check_1D100', '$check_1D20', '$check_2D6', '$check_nD10', '$check_nD6', '$check_nDx', '$is_a?', '$==', '$send', '$get_table_by_nD6', '$get_table_by_nDx', '$getTableValue', '$[]', '$-', '$/', '$getD66', '$bcdice', '$get_table_by_number', '$+', '$*', '$<', '$each', '$>=', '$kind_of?', '$lambda', '$call', '$select', '$public_methods', '$upcase', '$to_i', '$getTableInfoFromExtraTableText', '$get_table_by_nDx_extratable', '$get_table_by_d66', '$floor', '$%', '$get_table_by_d66_swap', '$raise', '$gsub', '$rollTableMessageDiceText', '$split', '$inspect']);
  return (function($base, $super, $parent_nesting) {
    var self = $klass($base, $super, 'DiceBot');

    var $nesting = [self].concat($parent_nesting), $DiceBot_initialize$4, $DiceBot_postSet$5, $DiceBot_info$6, $DiceBot_id$7, $DiceBot_gameType$8, $DiceBot_name$9, $DiceBot_gameName$10, $DiceBot_sort_key$11, $DiceBot_help_message$12, $DiceBot_getHelpMessage$13, $DiceBot_prefixes$14, $DiceBot_setSendMode$15, $DiceBot_bcdice$eq$16, $DiceBot_bcdice$17, $DiceBot_rand$18, $DiceBot_roll$19, $DiceBot_marshalSignOfInequality$20, $DiceBot_unlimitedRollDiceType$21, $DiceBot_setSortType$22, $DiceBot_d66$23, $DiceBot_parren_killer$24, $DiceBot_changeText$25, $DiceBot_dice_command$26, $DiceBot_isGetOriginalMessage$27, $DiceBot_removeDiceCommandMessage$28, $DiceBot_rollDiceCommandCatched$29, $DiceBot_rollDiceCommand$30, $DiceBot_dice_command_xRn$31, $DiceBot_check_result$32, $DiceBot_check_nDx$33, $DiceBot_check_1D100$34, $DiceBot_check_1D20$35, $DiceBot_check_nD10$36, $DiceBot_check_2D6$37, $DiceBot_check_nD6$38, $DiceBot_get_table_by_2d6$39, $DiceBot_get_table_by_1d6$40, $DiceBot_get_table_by_nD6$41, $DiceBot_get_table_by_nDx$42, $DiceBot_get_table_by_1d3$43, $DiceBot_getD66$44, $DiceBot_get_table_by_d66_swap$45, $DiceBot_get_table_by_d66$46, $DiceBot_getDiceRolledAdditionalText$47, $DiceBot_getDiceRevision$48, $DiceBot_isD9$49, $DiceBot_getGrichText$50, $DiceBot_check2dCritical$51, $DiceBot_is2dCritical$52, $DiceBot_should_reroll$ques$53, $DiceBot_get_table_by_number$54, $DiceBot_getTableValue$56, $DiceBot_analyzeDiceCommandResultMethod$58, $DiceBot_get_table_by_nDx_extratable$61, $DiceBot_getTableCommandResult$62, $DiceBot_getTableInfoFromExtraTableText$63, $DiceBot_roll_tables$65;

    self.$$prototype.rerollLimitCount = self.$$prototype.d66Type = nil;
    
    Opal.const_set($nesting[0], 'EMPTY_PREFIXES_PATTERN', /(^|\s)(S)?()(\s|$)/i.$freeze());
    Opal.const_set($nesting[0], 'ID', "DiceBot");
    Opal.const_set($nesting[0], 'NAME', "DiceBot");
    Opal.const_set($nesting[0], 'SORT_KEY', "*たいすほつと");
    Opal.const_set($nesting[0], 'HELP_MESSAGE', "");
    (function(self, $parent_nesting) {
      var $nesting = [self].concat($parent_nesting), $setPrefixes$1, $clearPrefixes$2, $inherited$3;

      
      self.$attr_reader("prefixes");
      self.$attr_reader("prefixesPattern");
      
      Opal.def(self, '$setPrefixes', $setPrefixes$1 = function $$setPrefixes(prefixes) {
        var self = this;

        
        self.prefixes = $send(prefixes, 'map', [], "freeze".$to_proc()).$freeze();
        self.prefixesPattern = new RegExp("" + "(^|\\s)(S)?(" + (prefixes.$join("|")) + ")(\\s|$)", 'i').$freeze();
        return self;
      }, $setPrefixes$1.$$arity = 1);
      
      Opal.def(self, '$clearPrefixes', $clearPrefixes$2 = function $$clearPrefixes() {
        var self = this;

        
        self.prefixes = [].$freeze();
        self.prefixesPattern = $$($nesting, 'EMPTY_PREFIXES_PATTERN');
        return self;
      }, $clearPrefixes$2.$$arity = 0);
      self.$private();
      return (Opal.def(self, '$inherited', $inherited$3 = function $$inherited(subclass) {
        var self = this;

        return subclass.$clearPrefixes()
      }, $inherited$3.$$arity = 1), nil) && 'inherited';
    })(Opal.get_singleton_class(self), $nesting);
    self.$clearPrefixes();
    (Opal.class_variable_set($nesting[0], '@@bcdice', nil));
    Opal.const_set($nesting[0], 'DEFAULT_SEND_MODE', 2);
    
    Opal.def(self, '$initialize', $DiceBot_initialize$4 = function $$initialize() {
      var $a, self = this;

      
      self.sendMode = $$($nesting, 'DEFAULT_SEND_MODE');
      self.sortType = 0;
      self.sameDiceRerollCount = 0;
      self.sameDiceRerollType = 0;
      self.d66Type = 1;
      self.isPrintMaxDice = false;
      self.upplerRollThreshold = 0;
      self.unlimitedRollDiceType = 0;
      self.rerollNumber = 0;
      self.defaultSuccessTarget = "";
      self.rerollLimitCount = 10000;
      self.fractionType = "omit";
      if ($truthy(($truthy($a = self.$prefixs()['$empty?']()['$!']()) ? self.$class().$prefixes()['$empty?']() : $a))) {
        
        self.$warn("" + (self.$id()) + ": #prefixs is deprecated. Please use .setPrefixes.");
        return self.$class().$setPrefixes(self.$prefixs());
      } else {
        return nil
      };
    }, $DiceBot_initialize$4.$$arity = 0);
    self.$attr_accessor("rerollLimitCount");
    self.$attr_reader("sendMode", "sameDiceRerollCount", "sameDiceRerollType", "d66Type");
    self.$attr_reader("isPrintMaxDice", "upplerRollThreshold");
    self.$attr_reader("defaultSuccessTarget", "rerollNumber", "fractionType");
    
    Opal.def(self, '$postSet', $DiceBot_postSet$5 = function $$postSet() {
      var self = this;

      return nil
    }, $DiceBot_postSet$5.$$arity = 0);
    
    Opal.def(self, '$info', $DiceBot_info$6 = function $$info() {
      var self = this;

      return $hash2(["gameType", "name", "sortKey", "prefixs", "info"], {"gameType": self.$id(), "name": self.$name(), "sortKey": self.$sort_key(), "prefixs": self.$class().$prefixes(), "info": self.$help_message()})
    }, $DiceBot_info$6.$$arity = 0);
    
    Opal.def(self, '$id', $DiceBot_id$7 = function $$id() {
      var self = this;

      return $$$(self.$class(), 'ID')
    }, $DiceBot_id$7.$$arity = 0);
    
    Opal.def(self, '$gameType', $DiceBot_gameType$8 = function $$gameType() {
      var self = this;

      
      self.$warn("" + (self.$id()) + ": #gameType is deprecated. Please use #id.");
      return self.$id();
    }, $DiceBot_gameType$8.$$arity = 0);
    
    Opal.def(self, '$name', $DiceBot_name$9 = function $$name() {
      var self = this;

      return $$$(self.$class(), 'NAME')
    }, $DiceBot_name$9.$$arity = 0);
    
    Opal.def(self, '$gameName', $DiceBot_gameName$10 = function $$gameName() {
      var self = this;

      
      self.$warn("" + (self.$id()) + ": #gameName is deprecated. Please use #name.");
      return self.$name();
    }, $DiceBot_gameName$10.$$arity = 0);
    
    Opal.def(self, '$sort_key', $DiceBot_sort_key$11 = function $$sort_key() {
      var self = this;

      return $$$(self.$class(), 'SORT_KEY')
    }, $DiceBot_sort_key$11.$$arity = 0);
    
    Opal.def(self, '$help_message', $DiceBot_help_message$12 = function $$help_message() {
      var self = this;

      return $$$(self.$class(), 'HELP_MESSAGE')
    }, $DiceBot_help_message$12.$$arity = 0);
    
    Opal.def(self, '$getHelpMessage', $DiceBot_getHelpMessage$13 = function $$getHelpMessage() {
      var self = this;

      
      self.$warn("" + (self.$id()) + ": #getHelpMessage is deprecated. Please use #help_message.");
      return self.$help_message();
    }, $DiceBot_getHelpMessage$13.$$arity = 0);
    
    Opal.def(self, '$prefixes', $DiceBot_prefixes$14 = function $$prefixes() {
      var self = this;

      return self.$class().$prefixes()
    }, $DiceBot_prefixes$14.$$arity = 0);
    Opal.alias(self, "prefixs", "prefixes");
    
    Opal.def(self, '$setSendMode', $DiceBot_setSendMode$15 = function $$setSendMode(m) {
      var self = this;

      return (self.sendMode = m)
    }, $DiceBot_setSendMode$15.$$arity = 1);
    self.$attr_writer("upplerRollThreshold");
    
    Opal.def(self, '$bcdice=', $DiceBot_bcdice$eq$16 = function(b) {
      var self = this;

      return (Opal.class_variable_set($nesting[0], '@@bcdice', b))
    }, $DiceBot_bcdice$eq$16.$$arity = 1);
    
    Opal.def(self, '$bcdice', $DiceBot_bcdice$17 = function $$bcdice() {
      var $a, self = this;

      return (($a = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $a)
    }, $DiceBot_bcdice$17.$$arity = 0);
    
    Opal.def(self, '$rand', $DiceBot_rand$18 = function $$rand(max) {
      var $a, self = this;

      return (($a = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $a).$rand(max)
    }, $DiceBot_rand$18.$$arity = 1);
    
    Opal.def(self, '$roll', $DiceBot_roll$19 = function $$roll($a) {
      var $post_args, args, $b, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send((($b = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $b), 'roll', Opal.to_a(args));
    }, $DiceBot_roll$19.$$arity = -1);
    
    Opal.def(self, '$marshalSignOfInequality', $DiceBot_marshalSignOfInequality$20 = function $$marshalSignOfInequality($a) {
      var $post_args, args, $b, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send((($b = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $b), 'marshalSignOfInequality', Opal.to_a(args));
    }, $DiceBot_marshalSignOfInequality$20.$$arity = -1);
    
    Opal.def(self, '$unlimitedRollDiceType', $DiceBot_unlimitedRollDiceType$21 = function $$unlimitedRollDiceType() {
      var $a, self = this;

      return (($a = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $a).$unlimitedRollDiceType()
    }, $DiceBot_unlimitedRollDiceType$21.$$arity = 0);
    self.$attr_reader("sortType");
    
    Opal.def(self, '$setSortType', $DiceBot_setSortType$22 = function $$setSortType(s) {
      var self = this;

      return (self.sortType = s)
    }, $DiceBot_setSortType$22.$$arity = 1);
    
    Opal.def(self, '$d66', $DiceBot_d66$23 = function $$d66($a) {
      var $post_args, args, $b, self = this;

      
      
      $post_args = Opal.slice.call(arguments, 0, arguments.length);
      
      args = $post_args;;
      return $send((($b = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $b), 'getD66Value', Opal.to_a(args));
    }, $DiceBot_d66$23.$$arity = -1);
    
    Opal.def(self, '$parren_killer', $DiceBot_parren_killer$24 = function $$parren_killer(string) {
      var $a, self = this;

      return (($a = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $a).$parren_killer(string)
    }, $DiceBot_parren_killer$24.$$arity = 1);
    
    Opal.def(self, '$changeText', $DiceBot_changeText$25 = function $$changeText(string) {
      var self = this;

      
      self.$debug("DiceBot.parren_killer_add called");
      return string;
    }, $DiceBot_changeText$25.$$arity = 1);
    
    Opal.def(self, '$dice_command', $DiceBot_dice_command$26 = function $$dice_command(string, nick_e) {
      var $a, $b, self = this, secret_flg = nil, secretMarker = nil, command = nil, output_msg = nil;

      
      if ($truthy(self.$isGetOriginalMessage())) {
        string = (($a = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $a).$getOriginalMessage()};
      self.$debug("dice_command Begin string", string);
      secret_flg = false;
      if ($truthy(self.$class().$prefixesPattern()['$=~'](string))) {
      } else {
        
        self.$debug("not match in prefixes");
        return ["1", secret_flg];
      };
      secretMarker = $$($nesting, 'Regexp').$last_match(2);
      command = $$($nesting, 'Regexp').$last_match(3);
      command = self.$removeDiceCommandMessage(command);
      self.$debug("dicebot after command", command);
      self.$debug("match");
      $b = self.$rollDiceCommandCatched(command), $a = Opal.to_ary($b), (output_msg = ($a[0] == null ? nil : $a[0])), (secret_flg = ($a[1] == null ? nil : $a[1])), $b;
      if ($truthy(($truthy($a = output_msg['$nil?']()) ? $a : output_msg['$empty?']()))) {
        output_msg = "1"};
      secret_flg = ($truthy($a = secret_flg) ? $a : false);
      if ($truthy(output_msg['$!=']("1"))) {
        output_msg = "" + (nick_e) + ": " + (output_msg)};
      if ($truthy(secretMarker)) {
        if ($truthy(output_msg['$!=']("1"))) {
          secret_flg = true}};
      return [output_msg, secret_flg];
    }, $DiceBot_dice_command$26.$$arity = 2);
    
    Opal.def(self, '$isGetOriginalMessage', $DiceBot_isGetOriginalMessage$27 = function $$isGetOriginalMessage() {
      var self = this;

      return false
    }, $DiceBot_isGetOriginalMessage$27.$$arity = 0);
    
    Opal.def(self, '$removeDiceCommandMessage', $DiceBot_removeDiceCommandMessage$28 = function $$removeDiceCommandMessage(command) {
      var self = this;

      return command.$sub(/[\s　].+/, "")
    }, $DiceBot_removeDiceCommandMessage$28.$$arity = 1);
    
    Opal.def(self, '$rollDiceCommandCatched', $DiceBot_rollDiceCommandCatched$29 = function $$rollDiceCommandCatched(command) {
      var $a, $b, self = this, result = nil, secret_flg = nil, e = nil;

      
      result = nil;
      
      try {
        
        self.$debug("call rollDiceCommand command", command);
        $b = self.$rollDiceCommand(command), $a = Opal.to_ary($b), (result = ($a[0] == null ? nil : $a[0])), (secret_flg = ($a[1] == null ? nil : $a[1])), $b;
      } catch ($err) {
        if (Opal.rescue($err, [$$($nesting, 'StandardError')])) {e = $err;
          try {
            self.$debug("executeCommand exception", e.$to_s(), e.$backtrace().$join("\n"))
          } finally { Opal.pop_exception() }
        } else { throw $err; }
      };;
      self.$debug("rollDiceCommand result", result);
      return [result, secret_flg];
    }, $DiceBot_rollDiceCommandCatched$29.$$arity = 1);
    
    Opal.def(self, '$rollDiceCommand', $DiceBot_rollDiceCommand$30 = function $$rollDiceCommand(_command) {
      var self = this;

      return nil
    }, $DiceBot_rollDiceCommand$30.$$arity = 1);
    
    Opal.def(self, '$dice_command_xRn', $DiceBot_dice_command_xRn$31 = function $$dice_command_xRn(_string, _nick_e) {
      var self = this;

      return ""
    }, $DiceBot_dice_command_xRn$31.$$arity = 2);
    
    Opal.def(self, '$check_result', $DiceBot_check_result$32 = function $$check_result(total, dice_total, dice_list, sides, cmp_op, target) {
      var $a, self = this, ret = nil, $case = nil;

      
      ret = (function() {$case = [dice_list.$size(), sides];
      if ([1, 100]['$===']($case)) {return self.$check_1D100(total, dice_total, cmp_op, target)}
      else if ([1, 20]['$===']($case)) {return self.$check_1D20(total, dice_total, cmp_op, target)}
      else if ([2, 6]['$===']($case)) {return self.$check_2D6(total, dice_total, dice_list, cmp_op, target)}
      else { return nil }})();
      if ($truthy(($truthy($a = ret['$nil?']()) ? $a : ret['$empty?']()))) {
      } else {
        return ret
      };
      ret = (function() {$case = sides;
      if ((10)['$===']($case)) {return self.$check_nD10(total, dice_total, dice_list, cmp_op, target)}
      else if ((6)['$===']($case)) {return self.$check_nD6(total, dice_total, dice_list, cmp_op, target)}
      else { return nil }})();
      if ($truthy(($truthy($a = ret['$nil?']()) ? $a : ret['$empty?']()))) {
      } else {
        return ret
      };
      return self.$check_nDx(total, cmp_op, target);
    }, $DiceBot_check_result$32.$$arity = 6);
    
    Opal.def(self, '$check_nDx', $DiceBot_check_nDx$33 = function $$check_nDx(total, cmp_op, target) {
      var self = this, success = nil;

      
      if ($truthy(target['$is_a?']($$($nesting, 'String')))) {
        return " ＞ 失敗"};
      success = (function() {if (cmp_op['$==']("!=")) {
        return total['$!='](target)
      } else {
        return total.$send(cmp_op, target)
      }; return nil; })();
      if ($truthy(success)) {
        return " ＞ 成功"
      } else {
        return " ＞ 失敗"
      };
    }, $DiceBot_check_nDx$33.$$arity = 3);
    
    Opal.def(self, '$check_1D100', $DiceBot_check_1D100$34 = function $$check_1D100(total, dice_total, cmp_op, target) {
      var self = this;

      return nil
    }, $DiceBot_check_1D100$34.$$arity = 4);
    
    Opal.def(self, '$check_1D20', $DiceBot_check_1D20$35 = function $$check_1D20(total, dice_total, cmp_op, target) {
      var self = this;

      return nil
    }, $DiceBot_check_1D20$35.$$arity = 4);
    
    Opal.def(self, '$check_nD10', $DiceBot_check_nD10$36 = function $$check_nD10(total, dice_total, dice_list, cmp_op, target) {
      var self = this;

      return nil
    }, $DiceBot_check_nD10$36.$$arity = 5);
    
    Opal.def(self, '$check_2D6', $DiceBot_check_2D6$37 = function $$check_2D6(total, dice_total, dice_list, cmp_op, target) {
      var self = this;

      return nil
    }, $DiceBot_check_2D6$37.$$arity = 5);
    
    Opal.def(self, '$check_nD6', $DiceBot_check_nD6$38 = function $$check_nD6(total, dice_total, dice_list, cmp_op, target) {
      var self = this;

      return nil
    }, $DiceBot_check_nD6$38.$$arity = 5);
    
    Opal.def(self, '$get_table_by_2d6', $DiceBot_get_table_by_2d6$39 = function $$get_table_by_2d6(table) {
      var self = this;

      return self.$get_table_by_nD6(table, 2)
    }, $DiceBot_get_table_by_2d6$39.$$arity = 1);
    
    Opal.def(self, '$get_table_by_1d6', $DiceBot_get_table_by_1d6$40 = function $$get_table_by_1d6(table) {
      var self = this;

      return self.$get_table_by_nD6(table, 1)
    }, $DiceBot_get_table_by_1d6$40.$$arity = 1);
    
    Opal.def(self, '$get_table_by_nD6', $DiceBot_get_table_by_nD6$41 = function $$get_table_by_nD6(table, count) {
      var self = this;

      return self.$get_table_by_nDx(table, count, 6)
    }, $DiceBot_get_table_by_nD6$41.$$arity = 2);
    
    Opal.def(self, '$get_table_by_nDx', $DiceBot_get_table_by_nDx$42 = function $$get_table_by_nDx(table, count, diceType) {
      var $a, $b, self = this, num = nil, text = nil;

      
      $b = self.$roll(count, diceType), $a = Opal.to_ary($b), (num = ($a[0] == null ? nil : $a[0])), $b;
      text = self.$getTableValue(table['$[]']($rb_minus(num, count)));
      if ($truthy(text['$nil?']())) {
        return ["1", 0]};
      return [text, num];
    }, $DiceBot_get_table_by_nDx$42.$$arity = 3);
    
    Opal.def(self, '$get_table_by_1d3', $DiceBot_get_table_by_1d3$43 = function $$get_table_by_1d3(table) {
      var $a, $b, self = this, count = nil, num = nil, index = nil, text = nil;

      
      self.$debug("get_table_by_1d3");
      count = 1;
      $b = self.$roll(count, 6), $a = Opal.to_ary($b), (num = ($a[0] == null ? nil : $a[0])), $b;
      self.$debug("num", num);
      index = $rb_divide($rb_minus(num, 1), 2);
      self.$debug("index", index);
      text = table['$[]'](index);
      if ($truthy(text['$nil?']())) {
        return ["1", 0]};
      return [text, num];
    }, $DiceBot_get_table_by_1d3$43.$$arity = 1);
    
    Opal.def(self, '$getD66', $DiceBot_getD66$44 = function $$getD66(isSwap) {
      var self = this;

      return self.$bcdice().$getD66(isSwap)
    }, $DiceBot_getD66$44.$$arity = 1);
    
    Opal.def(self, '$get_table_by_d66_swap', $DiceBot_get_table_by_d66_swap$45 = function $$get_table_by_d66_swap(table) {
      var self = this, isSwap = nil, number = nil;

      
      isSwap = true;
      number = self.$bcdice().$getD66(isSwap);
      return [self.$get_table_by_number(number, table), number];
    }, $DiceBot_get_table_by_d66_swap$45.$$arity = 1);
    
    Opal.def(self, '$get_table_by_d66', $DiceBot_get_table_by_d66$46 = function $$get_table_by_d66(table) {
      var $a, $b, self = this, dice1 = nil, dice2 = nil, num = nil, text = nil, indexText = nil;

      
      $b = self.$roll(1, 6), $a = Opal.to_ary($b), (dice1 = ($a[0] == null ? nil : $a[0])), $b;
      $b = self.$roll(1, 6), $a = Opal.to_ary($b), (dice2 = ($a[0] == null ? nil : $a[0])), $b;
      num = $rb_plus($rb_times($rb_minus(dice1, 1), 6), $rb_minus(dice2, 1));
      text = table['$[]'](num);
      indexText = "" + (dice1) + (dice2);
      if ($truthy(text['$nil?']())) {
        return ["1", indexText]};
      return [text, indexText];
    }, $DiceBot_get_table_by_d66$46.$$arity = 1);
    
    Opal.def(self, '$getDiceRolledAdditionalText', $DiceBot_getDiceRolledAdditionalText$47 = function $$getDiceRolledAdditionalText(_n1, _n_max, _dice_max) {
      var self = this;

      return ""
    }, $DiceBot_getDiceRolledAdditionalText$47.$$arity = 3);
    
    Opal.def(self, '$getDiceRevision', $DiceBot_getDiceRevision$48 = function $$getDiceRevision(_n_max, _dice_max, _total_n) {
      var self = this;

      return ["", 0]
    }, $DiceBot_getDiceRevision$48.$$arity = 3);
    
    Opal.def(self, '$isD9', $DiceBot_isD9$49 = function $$isD9() {
      var self = this;

      return false
    }, $DiceBot_isD9$49.$$arity = 0);
    
    Opal.def(self, '$getGrichText', $DiceBot_getGrichText$50 = function $$getGrichText(_numberSpot1, _dice_cnt_total, _suc) {
      var self = this;

      return ""
    }, $DiceBot_getGrichText$50.$$arity = 3);
    
    Opal.def(self, '$check2dCritical', $DiceBot_check2dCritical$51 = function $$check2dCritical(critical, dice_new, dice_arry, loop_count) {
      var self = this;

      return nil
    }, $DiceBot_check2dCritical$51.$$arity = 4);
    
    Opal.def(self, '$is2dCritical', $DiceBot_is2dCritical$52 = function $$is2dCritical() {
      var self = this;

      return false
    }, $DiceBot_is2dCritical$52.$$arity = 0);
    
    Opal.def(self, '$should_reroll?', $DiceBot_should_reroll$ques$53 = function(loop_count) {
      var $a, self = this;

      return ($truthy($a = $rb_lt(loop_count, self.rerollLimitCount)) ? $a : self.rerollLimitCount['$=='](0))
    }, $DiceBot_should_reroll$ques$53.$$arity = 1);
    
    Opal.def(self, '$get_table_by_number', $DiceBot_get_table_by_number$54 = function $$get_table_by_number(index, table, default$) {try {

      var $$55, self = this;

      
      
      if (default$ == null) {
        default$ = "1";
      };
      $send(table, 'each', [], ($$55 = function(item){var self = $$55.$$s || this, number = nil;

      
        
        if (item == null) {
          item = nil;
        };
        number = item['$[]'](0);
        if ($truthy($rb_ge(number, index))) {
          Opal.ret(self.$getTableValue(item['$[]'](1)))
        } else {
          return nil
        };}, $$55.$$s = self, $$55.$$arity = 1, $$55));
      return self.$getTableValue(default$);
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $DiceBot_get_table_by_number$54.$$arity = -3);
    
    Opal.def(self, '$getTableValue', $DiceBot_getTableValue$56 = function $$getTableValue(data) {try {

      var $$57, self = this, lambdaBlock = nil;

      
      if ($truthy(data['$kind_of?']($$($nesting, 'Proc')))) {
        
        lambdaBlock = $send(self, 'lambda', [], ($$57 = function(){var self = $$57.$$s || this;

        Opal.ret(data.$call())}, $$57.$$s = self, $$57.$$arity = 0, $$57));
        return lambdaBlock.$call();};
      return data;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $DiceBot_getTableValue$56.$$arity = 1);
    
    Opal.def(self, '$analyzeDiceCommandResultMethod', $DiceBot_analyzeDiceCommandResultMethod$58 = function $$analyzeDiceCommandResultMethod(command) {try {

      var $$59, $$60, self = this, methodList = nil;

      
      methodList = $send(self.$public_methods(), 'select', [], ($$59 = function(method){var self = $$59.$$s || this;

      
        
        if (method == null) {
          method = nil;
        };
        return /^get.+DiceCommandResult$/['$==='](method.$to_s());}, $$59.$$s = self, $$59.$$arity = 1, $$59));
      $send(methodList, 'each', [], ($$60 = function(method){var self = $$60.$$s || this, result = nil;

      
        
        if (method == null) {
          method = nil;
        };
        result = self.$send(method, command);
        if ($truthy(result['$nil?']())) {
          return nil
        } else {
          Opal.ret(result)
        };}, $$60.$$s = self, $$60.$$arity = 1, $$60));
      return nil;
      } catch ($returner) { if ($returner === Opal.returner) { return $returner.$v } throw $returner; }
    }, $DiceBot_analyzeDiceCommandResultMethod$58.$$arity = 1);
    
    Opal.def(self, '$get_table_by_nDx_extratable', $DiceBot_get_table_by_nDx_extratable$61 = function $$get_table_by_nDx_extratable(table, count, diceType) {
      var $a, $b, self = this, number = nil, diceText = nil, text = nil;

      
      $b = self.$roll(count, diceType), $a = Opal.to_ary($b), (number = ($a[0] == null ? nil : $a[0])), (diceText = ($a[1] == null ? nil : $a[1])), $b;
      text = self.$getTableValue(table['$[]']($rb_minus(number, count)));
      return [text, number, diceText];
    }, $DiceBot_get_table_by_nDx_extratable$61.$$arity = 3);
    
    Opal.def(self, '$getTableCommandResult', $DiceBot_getTableCommandResult$62 = function $$getTableCommandResult(command, tables, isPrintDiceText) {
      var $a, $b, $c, $d, self = this, info = nil, name = nil, type = nil, table = nil, $case = nil, count = nil, diceType = nil, limit = nil, item = nil, value = nil, output = nil, diceText = nil, text = nil, number = nil;

      
      
      if (isPrintDiceText == null) {
        isPrintDiceText = true;
      };
      info = tables['$[]'](command.$upcase());
      if ($truthy(info['$nil?']())) {
        return nil};
      name = info['$[]']("name");
      type = info['$[]']("type").$upcase();
      table = info['$[]']("table");
      if ($truthy(($truthy($a = type['$==']("D66")) ? self.d66Type['$=='](2) : $a))) {
        type = "D66S"};
      $b = (function() {$case = type;
      if (/(\d+)D(\d+)/['$===']($case)) {
      count = $$($nesting, 'Regexp').$last_match(1).$to_i();
      diceType = $$($nesting, 'Regexp').$last_match(2).$to_i();
      limit = $rb_minus($rb_times(diceType, count), $rb_minus(count, 1));
      table = self.$getTableInfoFromExtraTableText(table, limit);
      return self.$get_table_by_nDx_extratable(table, count, diceType);}
      else if ("D66"['$===']($case) || "D66N"['$===']($case)) {
      table = self.$getTableInfoFromExtraTableText(table, 36);
      $d = self.$get_table_by_d66(table), $c = Opal.to_ary($d), (item = ($c[0] == null ? nil : $c[0])), (value = ($c[1] == null ? nil : $c[1])), $d;
      value = value.$to_i();
      output = item['$[]'](1);
      diceText = $rb_plus($rb_plus($rb_divide(value, 10).$floor().$to_s(), ","), value['$%'](10).$to_s());
      return [output, value, diceText];}
      else if ("D66S"['$===']($case)) {
      table = self.$getTableInfoFromExtraTableText(table, 21);
      $d = self.$get_table_by_d66_swap(table), $c = Opal.to_ary($d), (output = ($c[0] == null ? nil : $c[0])), (value = ($c[1] == null ? nil : $c[1])), $d;
      value = value.$to_i();
      diceText = $rb_plus($rb_plus($rb_divide(value, 10).$floor().$to_s(), ","), value['$%'](10).$to_s());
      return [output, value, diceText];}
      else {return self.$raise("" + "invalid dice Type " + (command))}})(), $a = Opal.to_ary($b), (text = ($a[0] == null ? nil : $a[0])), (number = ($a[1] == null ? nil : $a[1])), (diceText = ($a[2] == null ? nil : $a[2])), $b;
      text = text.$gsub("\\n", "\n");
      text = (($a = $nesting[0].$$cvars['@@bcdice']) == null ? nil : $a).$rollTableMessageDiceText(text);
      if ($truthy(text['$nil?']())) {
        return nil};
      if ($truthy(($truthy($a = isPrintDiceText) ? diceText['$nil?']()['$!']() : $a))) {
        return "" + (name) + "(" + (number) + "[" + (diceText) + "]) ＞ " + (text)};
      return "" + (name) + "(" + (number) + ") ＞ " + (text);
    }, $DiceBot_getTableCommandResult$62.$$arity = -3);
    
    Opal.def(self, '$getTableInfoFromExtraTableText', $DiceBot_getTableInfoFromExtraTableText$63 = function $$getTableInfoFromExtraTableText(text, count) {
      var $$64, self = this, newTable = nil;

      
      
      if (count == null) {
        count = nil;
      };
      if ($truthy(text['$is_a?']($$($nesting, 'String')))) {
        text = text.$split(/\n/)};
      newTable = $send(text, 'map', [], ($$64 = function(item){var self = $$64.$$s || this, $a;

      
        
        if (item == null) {
          item = nil;
        };
        if ($truthy(($truthy($a = item['$is_a?']($$($nesting, 'String'))) ? /^(\d+):(.*)/['$==='](item) : $a))) {
          return [$$($nesting, 'Regexp').$last_match(1).$to_i(), $$($nesting, 'Regexp').$last_match(2)]
        } else {
          return item
        };}, $$64.$$s = self, $$64.$$arity = 1, $$64));
      if ($truthy(count['$nil?']())) {
      } else if ($truthy(newTable.$size()['$!='](count))) {
        self.$raise("" + "invalid table size:" + (newTable.$size()) + "\n" + (newTable.$inspect()))};
      return newTable;
    }, $DiceBot_getTableInfoFromExtraTableText$63.$$arity = -2);
    return (Opal.def(self, '$roll_tables', $DiceBot_roll_tables$65 = function $$roll_tables(command, tables) {
      var self = this, table = nil;

      
      table = tables['$[]'](command.$upcase());
      if ($truthy(table)) {
      } else {
        return nil
      };
      return table.$roll(self.$bcdice()).$to_s();
    }, $DiceBot_roll_tables$65.$$arity = 2), nil) && 'roll_tables';
  })($nesting[0], null, $nesting)
})(Opal);
