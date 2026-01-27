import React, { useState } from 'react';

const DataDeletionRequest: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountId, setAccountId] = useState('');
  const [reason, setReason] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Nome e e-mail são obrigatórios.');
      return;
    }

    setSuccess(true);
    setError('');
    // Reset form
    setName('');
    setEmail('');
    setAccountId('');
    setReason('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h1 style={styles.title}>Solicitação de Exclusão de Conta e Dados</h1>
        <p style={styles.intro}>
          De acordo com a LGPD (Lei nº 13.709/2018), você tem direito à eliminação dos seus dados pessoais. Preencha o formulário abaixo e enviaremos a confirmação em até 15 dias.
        </p>

        {success && <p style={styles.success}>Solicitação enviada com sucesso! Entraremos em contato em breve.</p>}
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nome completo *
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
          </label>

          <label style={styles.label}>
            E-mail cadastrado *
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          </label>

          <label style={styles.label}>
            ID da conta ou usuário (se souber)
            <input type="text" value={accountId} onChange={(e) => setAccountId(e.target.value)} style={styles.input} />
          </label>

          <label style={styles.label}>
            Motivo da solicitação (opcional)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} style={styles.textarea} rows={4} />
          </label>

          <button type="submit" style={styles.button}>Enviar Solicitação</button>
        </form>

        <p style={styles.footer}>
          Seu pedido será analisado pelo nosso DPO. Contato: privacidade@pluralplataforma.com
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '40px 20px',
    fontFamily: 'Arial, sans-serif',
  },
  formContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    color: '#1a1a1a',
    marginBottom: '20px',
  },
  intro: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'justify' as const,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginTop: '8px',
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginTop: '8px',
    resize: 'vertical' as const,
  },
  button: {
    padding: '14px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  footer: {
    fontSize: '16px',
    textAlign: 'center' as const,
    marginTop: '40px',
    color: '#666',
  },
};

export default DataDeletionRequest;