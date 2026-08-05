export default function Card({ children, className = '', corners = true, ...props }) {
  return (
    <div className={`card ${corners ? 'card-corners' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
}
