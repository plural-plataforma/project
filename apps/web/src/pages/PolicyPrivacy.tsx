import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Política de Privacidade</h1>
        <h2 style={styles.subtitle}>Plural Plataforma</h2>
        <p style={styles.update}>Última atualização: 23 de dezembro de 2025</p>

        <p style={styles.intro}>
          A Plural Apps ("nós", "nosso" ou "Plural Plataforma"), proprietária do aplicativo e plataforma "Plural Plataforma", inscrita no CNPJ sob o nº [INSIRA O CNPJ DA EMPRESA], com sede em [INSIRA ENDEREÇO COMPLETO], valoriza a privacidade dos usuários e está comprometida com a proteção dos dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018), o Marco Civil da Internet e demais normas aplicáveis.
        </p>

        <h3 style={styles.sectionTitle}>1. Dados que coletamos</h3>
        <p style={styles.text}>
          Coletamos dados mínimos e necessários para o funcionamento da plataforma:<br /><br />
          • Dados fornecidos por você: nome, e-mail, telefone e informações de cadastro (quando aplicável).<br /><br />
          • Dados coletados automaticamente: endereço IP, dados de uso da plataforma e localização (somente com consentimento explícito).<br /><br />
          • Dados de terceiros: informações anonimizadas de serviços integrados (ex: analytics).
        </p>

        <h3 style={styles.sectionTitle}>2. Finalidades do tratamento</h3>
        <p style={styles.text}>
          Usamos seus dados para:<br />
          • Fornecer e melhorar os serviços da plataforma.<br />
          • Personalizar a experiência do usuário.<br />
          • Enviar notificações e comunicações (com seu consentimento).<br />
          • Realizar análises estatísticas e correções de erros.<br />
          • Cumprir obrigações legais e prevenir fraudes.
        </p>

        <h3 style={styles.sectionTitle}>3. Compartilhamento e segurança</h3>
        <p style={styles.text}>
          Compartilhamos dados apenas com provedores essenciais (ex: hospedagem, analytics) que atuam como operadores e com autoridades quando exigido por lei. Não vendemos dados pessoais.<br /><br />
          Adotamos medidas robustas de segurança, como criptografia e controles de acesso.
        </p>

        <h3 style={styles.sectionTitle}>4. Seus direitos (LGPD)</h3>
        <p style={styles.text}>
          Você tem direito a acessar, corrigir, anonimizar, bloquear, eliminar ou portar seus dados, revogar consentimentos e apresentar reclamações à ANPD.<br /><br />
          Para exercer esses direitos, entre em contato conosco.
        </p>

        <h3 style={styles.sectionTitle}>5. Contato</h3>
        <p style={styles.text}>
          Dúvidas ou solicitações? Envie um e-mail para nosso Encarregado de Proteção de Dados (DPO):<br /><br />
          <a href="mailto:privacidade@pluralplataforma.com" style={styles.link}>
            privacidade@pluralplataforma.com
          </a>
        </p>

        <p style={styles.footer}>
          Obrigado por confiar na Plural Plataforma! 💙
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
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '24px',
    textAlign: 'center' as const,
    color: '#555',
    marginBottom: '4px',
  },
  update: {
    fontSize: '16px',
    textAlign: 'center' as const,
    color: '#888',
    marginBottom: '40px',
  },
  intro: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '40px',
    textAlign: 'justify' as const,
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '40px 0 16px',
    color: '#1a1a1a',
  },
  text: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'justify' as const,
  },
  link: {
    color: '#0066cc',
    textDecoration: 'underline',
    fontWeight: '600',
  },
  footer: {
    fontSize: '18px',
    textAlign: 'center' as const,
    marginTop: '60px',
    color: '#666',
    fontStyle: 'italic',
  },
};

export default PrivacyPolicy;