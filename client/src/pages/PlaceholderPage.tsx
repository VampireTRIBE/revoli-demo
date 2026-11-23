export function PlaceholderPage({ heading }: { heading: string }) {
  return <section className="v2-placeholder"><h2>{heading}</h2><div className="v2-search-await"><span className="v2-awaiting-dot"/><span><b>AWAITING</b> Approved source imports and product definitions are not supplied for this reporting head. No results or scores are generated.</span></div></section>;
}
