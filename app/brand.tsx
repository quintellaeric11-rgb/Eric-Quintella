export function KonkiMark({className=''}:{className?:string}){
  // SVG local e pequeno; o elemento nativo evita duplicação de React no runtime Vinext.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`konki-mark ${className}`} src="/logo-symbol.svg?v=4" width="40" height="40" alt="KONKI"/>
}
export function KonkiLogo(){return <div className="logo"><KonkiMark/><div><b>KONKI</b><small>Aprenda a conquistar.</small></div></div>}
