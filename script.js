(()=>{
  const screen = document.getElementById('screen');
  const buttons = Array.from(document.querySelectorAll('.btn'));
  let buffer = '';

  function render(){
    screen.textContent = buffer || '0';
  }

  function clearAll(){ buffer = ''; render(); }
  function back(){ buffer = buffer.slice(0,-1); render(); }

  function pressValue(v){
    if (buffer.length >= 200) return;
    buffer += v;
    render();
  }

  // Tokenize input string into numbers and operators
  function tokenize(str){
    const tokens = [];
    let i = 0;
    const len = str.length;
    while(i < len){
      const ch = str[i];
      if (ch === ' '){ i++; continue; }

      // number (with optional leading unary -)
      if (ch === '-' && (i === 0 || '()+-*/'.includes(str[i-1])) && /[0-9.]/.test(str[i+1])){
        // unary minus as part of number
        let j = i+1; while(j < len && /[0-9.]/.test(str[j])) j++;
        tokens.push(str.slice(i, j));
        i = j; continue;
      }

      if (/[0-9.]/.test(ch)){
        let j = i+1; while(j < len && /[0-9.]/.test(str[j])) j++;
        tokens.push(str.slice(i, j));
        i = j; continue;
      }

      if ('+-*/()'.includes(ch)){
        tokens.push(ch);
        i++; continue;
      }

      // unknown char -> skip
      i++;
    }
    return tokens;
  }

  // Shunting-yard: convert tokens to RPN
  function toRPN(tokens){
    const out = [];
    const ops = [];
    const prec = { '+':1, '-':1, '*':2, '/':2 };

    tokens.forEach(t => {
      if (/^-?[0-9]+(?:\.[0-9]*)?$/.test(t)) { out.push(t); return; }
      if ('+-*/'.includes(t)){
        while(ops.length){
          const o = ops[ops.length-1];
          if ('+-*/'.includes(o) && ((prec[o] > prec[t]) || (prec[o] === prec[t]))) out.push(ops.pop());
          else break;
        }
        ops.push(t);
        return;
      }
      if (t === '('){ ops.push(t); return; }
      if (t === ')'){
        while(ops.length && ops[ops.length-1] !== '(') out.push(ops.pop());
        if (ops.length && ops[ops.length-1] === '(') ops.pop();
        return;
      }
    });

    while(ops.length) out.push(ops.pop());
    return out;
  }

  function evalRPN(rpn){
    const s = [];
    for(const t of rpn){
      if (/^-?[0-9]+(?:\.[0-9]*)?$/.test(t)) s.push(parseFloat(t));
      else {
        if (s.length < 2) return null;
        const b = s.pop(), a = s.pop();
        let r = null;
        if (t === '+') r = a + b;
        else if (t === '-') r = a - b;
        else if (t === '*') r = a * b;
        else if (t === '/') r = b === 0 ? Infinity : a / b;
        else return null;
        s.push(r);
      }
    }
    return s.length === 1 ? s[0] : null;
  }

  function evaluateExpression(expr){
    try{
      const tokens = tokenize(expr);
      if (tokens.length === 0) return null;
      const rpn = toRPN(tokens);
      const val = evalRPN(rpn);
      if (val === null || Number.isNaN(val)) return null;
      return val;
    }catch(e){ return null; }
  }

  function answer(){
    if (!buffer) return;
    const val = evaluateExpression(buffer);
    if (val === null) {
      screen.textContent = 'Error';
    } else {
      // clean display: integer without decimal point when possible
      const out = (Math.abs(val - Math.round(val)) < 1e-12) ? String(Math.round(val)) : String(val);
      screen.textContent = out;
      buffer = out;
    }
  }

  buttons.forEach(b=>{
    b.addEventListener('click',()=>{
      const a = b.dataset.action;
      const v = b.dataset.value;
      if (a === 'clear') return clearAll();
      if (a === 'back') return back();
      if (a === 'equals') return answer();
      if (v) return pressValue(v);
    }, {passive:true});
  });

  // Keyboard support (Enter => equals, Backspace, Escape)
  window.addEventListener('keydown', (ev)=>{
    if (ev.key === 'Enter') { ev.preventDefault(); answer(); }
    else if (ev.key === 'Backspace') { ev.preventDefault(); back(); }
    else if (ev.key === 'Escape') { ev.preventDefault(); clearAll(); }
    else if (/^[0-9.+\-*/()]$/.test(ev.key)) { ev.preventDefault(); pressValue(ev.key); }
  });

  document.addEventListener('touchstart', ()=>{}, {passive:true});

  render();
})();
