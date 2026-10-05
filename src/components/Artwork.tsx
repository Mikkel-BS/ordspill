export function Landscape() {
  return <svg className="landscape" viewBox="0 0 640 220" role="img" aria-label="En liten sti gjennom grønne åser, med trær og sol">
    <circle cx="529" cy="49" r="30" fill="#efbe64"/><path d="M0 163Q105 80 231 153T460 129T640 132V220H0Z" fill="#dce4c8"/><path d="M0 185Q144 121 296 180T640 154V220H0Z" fill="#b7c9a4"/>
    <path d="M390 220Q272 188 380 162Q407 152 390 144" fill="none" stroke="#f6ead4" strokeWidth="21"/>
    <g fill="#557b62"><path d="M80 84l-40 78h80Z"/><path d="M132 111l-27 61h54Z"/><path d="M569 104l-34 74h68Z"/></g><g stroke="#6f6a46" strokeWidth="6"><path d="M80 160v25M132 171v18M569 177v15"/></g>
    <g transform="translate(244 126)"><ellipse cx="0" cy="38" rx="30" ry="7" fill="#779570" opacity=".3"/><path d="M-22 0Q-13-15 0-9Q13-15 22 0V29Q0 44-22 29Z" fill="#b97143"/><path d="M-21 0l-1-19 18 10M21 0l1-19-18 10" fill="#b97143"/><path d="M-19 7Q-10 2 0 17Q10 2 19 7V27Q0 40-19 27Z" fill="#f7e4c1"/><circle cx="-9" cy="13" r="2.5" fill="#30463c"/><circle cx="9" cy="13" r="2.5" fill="#30463c"/><path d="M-4 23h8l-4 4Z" fill="#30463c"/></g>
    <g fill="#f6f7ee" opacity=".8"><ellipse cx="163" cy="52" rx="31" ry="10"/><ellipse cx="184" cy="47" rx="20" ry="14"/><ellipse cx="423" cy="77" rx="27" ry="9"/></g>
    <g fill="#fff5cc"><circle cx="33" cy="203" r="3"/><circle cx="152" cy="202" r="3"/><circle cx="491" cy="193" r="3"/></g>
  </svg>;
}
export function Picture({ image, label, size = 'large' }: { image?: string; label: string; size?: 'large' | 'small' }) {
  return <span className={`picture ${size}`} role="img" aria-label={label}>{image === 'table' ? <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><path d="M20 40v44M80 40v44" stroke="#8d6548" strokeWidth="9" strokeLinecap="round"/><rect x="10" y="29" width="80" height="16" rx="5" fill="#bf9069"/><path d="M22 50h56" stroke="#a97954" strokeWidth="7"/></svg> : image ?? '📖'}</span>;
}
