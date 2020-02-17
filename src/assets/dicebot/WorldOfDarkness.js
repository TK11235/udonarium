/* Generated by Opal 0.11.4 */
(function(Opal) {
  function $rb_lt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs < rhs : lhs['$<'](rhs);
  }
  function $rb_plus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs + rhs : lhs['$+'](rhs);
  }
  function $rb_gt(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs > rhs : lhs['$>'](rhs);
  }
  function $rb_minus(lhs, rhs) {
    return (typeof(lhs) === 'number' && typeof(rhs) === 'number') ? lhs - rhs : lhs['$-'](rhs);
  }
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice, $klass = Opal.klass, $send = Opal.send, $truthy = Opal.truthy;

  Opal.add_stubs(['$setPrefixes', '$rollWorldOfDarkness', '$empty?', '$match', '$to_i', '$[]', '$==', '$<', '$+', '$to_s', '$rollDiceWorldOfDarknessSpecial', '$>', '$new', '$times', '$roll', '$===', '$-', '$[]=', '$sort!', '$each', '$chop']);
  return (function($base, $super, $parent_nesting) {
    function $WorldOfDarkness(){};
    var self = $WorldOfDarkness = $klass($base, $super, 'WorldOfDarkness', $WorldOfDarkness);

    var def = self.$$proto, $nesting = [self].concat($parent_nesting), TMP_WorldOfDarkness_initialize_1, TMP_WorldOfDarkness_gameName_2, TMP_WorldOfDarkness_gameType_3, TMP_WorldOfDarkness_getHelpMessage_4, TMP_WorldOfDarkness_rollDiceCommand_5, TMP_WorldOfDarkness_rollWorldOfDarkness_6, TMP_WorldOfDarkness_rollDiceWorldOfDarknessSpecial_9;

    def.rerollDice = def.successDice = def.botchDice = nil;
    
    self.$setPrefixes(["\\d+st.*"]);
    
    Opal.defn(self, '$initialize', TMP_WorldOfDarkness_initialize_1 = function $$initialize() {
      var self = this, $iter = TMP_WorldOfDarkness_initialize_1.$$p, $yield = $iter || nil, $zuper = nil, $zuper_i = nil, $zuper_ii = nil;

      if ($iter) TMP_WorldOfDarkness_initialize_1.$$p = null;
      // Prepare super implicit arguments
      for($zuper_i = 0, $zuper_ii = arguments.length, $zuper = new Array($zuper_ii); $zuper_i < $zuper_ii; $zuper_i++) {
        $zuper[$zuper_i] = arguments[$zuper_i];
      }
      
      $send(self, Opal.find_super_dispatcher(self, 'initialize', TMP_WorldOfDarkness_initialize_1, false), $zuper, $iter);
      self.successDice = 0;
      self.botchDice = 0;
      return (self.rerollDice = 0);
    }, TMP_WorldOfDarkness_initialize_1.$$arity = 0);
    
    Opal.defn(self, '$gameName', TMP_WorldOfDarkness_gameName_2 = function $$gameName() {
      var self = this;

      return "ワールドオブダークネス"
    }, TMP_WorldOfDarkness_gameName_2.$$arity = 0);
    
    Opal.defn(self, '$gameType', TMP_WorldOfDarkness_gameType_3 = function $$gameType() {
      var self = this;

      return "WorldOfDarkness"
    }, TMP_WorldOfDarkness_gameType_3.$$arity = 0);
    
    Opal.defn(self, '$getHelpMessage', TMP_WorldOfDarkness_getHelpMessage_4 = function $$getHelpMessage() {
      var self = this;

      return "" + "・判定コマンド(xSTn+y or xSTSn+y)\n" + "　(ダイス個数)ST(難易度)+(自動成功)\n" + "　(ダイス個数)STS(難易度)+(自動成功)　※出目10で振り足し\n" + "\n" + "　難易度=省略時6\n" + "　自動成功=省略時0\n" + "\n" + "　例）3ST7　5ST+1　4ST5+2\n"
    }, TMP_WorldOfDarkness_getHelpMessage_4.$$arity = 0);
    
    Opal.defn(self, '$rollDiceCommand', TMP_WorldOfDarkness_rollDiceCommand_5 = function $$rollDiceCommand(command) {
      var self = this, result = nil;

      
      result = self.$rollWorldOfDarkness(command);
      if ($truthy(result['$empty?']())) {
        return nil
        } else {
        return result
      };
    }, TMP_WorldOfDarkness_rollDiceCommand_5.$$arity = 1);
    
    Opal.defn(self, '$rollWorldOfDarkness', TMP_WorldOfDarkness_rollWorldOfDarkness_6 = function $$rollWorldOfDarkness(string) {
      var $a, self = this, diceCount = nil, difficulty = nil, automaticSuccess = nil, output = nil, rerollNumber = nil, m = nil;

      
      diceCount = 1;
      difficulty = 6;
      automaticSuccess = 0;
      output = "";
      rerollNumber = 11;
      m = string.$match(/(\d+)(STS?)(\d*)([^\d\s][\+\-\d]+)?/i);
      diceCount = m['$[]'](1).$to_i();
      if (m['$[]'](2)['$==']("STS")) {
        rerollNumber = 10};
      difficulty = m['$[]'](3).$to_i();
      if ($truthy(m['$[]'](4))) {
        automaticSuccess = m['$[]'](4).$to_i()};
      if ($truthy($rb_lt(difficulty, 2))) {
        difficulty = 6};
      output = $rb_plus($rb_plus($rb_plus($rb_plus($rb_plus("DicePool=", diceCount.$to_s()), ", Difficulty="), difficulty.$to_s()), ", AutomaticSuccess="), automaticSuccess.$to_s());
      self.successDice = 0;
      self.botchDice = 0;
      self.rerollDice = 0;
      output = $rb_plus(output, self.$rollDiceWorldOfDarknessSpecial(diceCount, difficulty, rerollNumber));
      while ($truthy($rb_gt(self.rerollDice, 0))) {
        
        diceCount = self.rerollDice;
        self.rerollDice = 0;
        output = $rb_plus(output, self.$rollDiceWorldOfDarknessSpecial(diceCount, difficulty, rerollNumber));
      };
      self.successDice = $rb_plus(self.successDice, automaticSuccess);
      if ($truthy($rb_gt(self.successDice, 0))) {
        output = $rb_plus(output, $rb_plus(" ＞ 成功数", self.successDice.$to_s()))
      } else if ($truthy($rb_gt(self.botchDice, 0))) {
        output = $rb_plus(output, " ＞ 大失敗")
        } else {
        output = $rb_plus(output, " ＞ 失敗")
      };
      return output;
    }, TMP_WorldOfDarkness_rollWorldOfDarkness_6.$$arity = 1);
    return (Opal.defn(self, '$rollDiceWorldOfDarknessSpecial', TMP_WorldOfDarkness_rollDiceWorldOfDarknessSpecial_9 = function $$rollDiceWorldOfDarknessSpecial(diceCount, difficulty, rerollNumber) {
      var TMP_7, TMP_8, self = this, diceType = nil, diceResults = nil, result = nil;

      
      diceType = 10;
      diceResults = Opal.const_get_relative($nesting, 'Array').$new(diceCount);
      $send(diceCount, 'times', [], (TMP_7 = function(i){var self = TMP_7.$$s || this, $a, $b, dice_now = nil, $case = nil, $writer = nil;
        if (self.successDice == null) self.successDice = nil;
        if (self.rerollDice == null) self.rerollDice = nil;
        if (self.botchDice == null) self.botchDice = nil;
if (i == null) i = nil;
      
        $b = self.$roll(1, diceType), $a = Opal.to_ary($b), (dice_now = ($a[0] == null ? nil : $a[0])), $b;
        $case = dice_now;
        if (Opal.Range.$new(rerollNumber, 12, false)['$===']($case)) {
        self.successDice = $rb_plus(self.successDice, 1);
        self.rerollDice = $rb_plus(self.rerollDice, 1);}
        else if (Opal.Range.$new(difficulty, 11, false)['$===']($case)) {self.successDice = $rb_plus(self.successDice, 1)}
        else if ((1)['$===']($case)) {
        self.successDice = $rb_minus(self.successDice, 1);
        self.botchDice = $rb_plus(self.botchDice, 1);};
        
        $writer = [i, dice_now];
        $send(diceResults, '[]=', Opal.to_a($writer));
        return $writer[$rb_minus($writer["length"], 1)];;}, TMP_7.$$s = self, TMP_7.$$arity = 1, TMP_7));
      diceResults['$sort!']();
      result = " ＞ ";
      $send(diceResults, 'each', [], (TMP_8 = function(diceResult){var self = TMP_8.$$s || this;
if (diceResult == null) diceResult = nil;
      return (result = $rb_plus(result, $rb_plus(diceResult.$to_s(), ",")))}, TMP_8.$$s = self, TMP_8.$$arity = 1, TMP_8));
      result = result.$chop();
      return result;
    }, TMP_WorldOfDarkness_rollDiceWorldOfDarknessSpecial_9.$$arity = 3), nil) && 'rollDiceWorldOfDarknessSpecial';
  })($nesting[0], Opal.const_get_relative($nesting, 'DiceBot'), $nesting)
})(Opal);

/* Generated by Opal 0.11.4 */
(function(Opal) {
  var self = Opal.top, $nesting = [], nil = Opal.nil, $breaker = Opal.breaker, $slice = Opal.slice;

  Opal.add_stubs(['$exit']);
  return Opal.const_get_relative($nesting, 'Kernel').$exit()
})(Opal);
