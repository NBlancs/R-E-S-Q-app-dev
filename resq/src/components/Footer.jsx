import '../dashboard/Dashboard.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-left">
          <p>© {year} R‑E‑S‑Q</p>
        </div>

        <div className="footer-center">
          <a href="mailto:support@resq.example">Support</a>
          <span className="sep">•</span>
          <a href="/privacy">Privacy</a>
          <span className="sep">•</span>
          <a href="/terms">Terms</a>
        </div>

        <div className="footer-right">
          <span className="version">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
