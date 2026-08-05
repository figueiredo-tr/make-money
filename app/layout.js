import './globals.css';

export const metadata = {
  title: 'Gestão de Empréstimos',
  description: 'Sistema interno de controle de empréstimos e parcelas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
