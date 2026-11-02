/** Produce every name before mutating anything, so invalid requests are atomic. */
export function numberedNames(count,prefix,start,padding){
  if(typeof prefix!=='string'||/[\u0000-\u001f\u007f]/.test(prefix))throw new Error('Informe um prefixo válido.');
  prefix=prefix.trim();
  if(!prefix||/[\u0000-\u001f\u007f]/.test(prefix))throw new Error('Informe um prefixo válido.');
  if(!Number.isSafeInteger(count)||count<1||count>1000)throw new Error('Nenhum resultado para renomear.');
  if(!Number.isSafeInteger(start)||start<0||start+count-1>999999)throw new Error('Numeração deve estar entre 0 e 999999.');
  if(!Number.isSafeInteger(padding)||padding<1||padding>6)throw new Error('Dígitos devem estar entre 1 e 6.');
  const names=Array.from({length:count},(_,i)=>`${prefix} ${String(start+i).padStart(padding,'0')}`);
  if(names.some(name=>name.length>100))throw new Error('Os nomes devem ter até 100 caracteres.');
  return names;
}
