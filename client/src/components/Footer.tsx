// Features and logic by Wajihi Ramadan (JeehTech)
export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            borderTop: '1px solid var(--border-color)'
        }}>
            &copy; {year} Developed and Maintained By Powercomputers LTD
        </footer>
    );
}
