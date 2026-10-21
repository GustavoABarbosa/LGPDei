import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidade — LGPDei",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" updatedAt="13 de outubro de 2026">
      <p>
        Esta política explica como o LGPDei trata dados pessoais, em
        conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº
        13.709/2018, &quot;LGPD&quot;).
      </p>

      <LegalSection title="1. Controlador e encarregado">
        <ul>
          <li>
            <strong>Controlador:</strong> Gustavo Ariel Barbosa, e-mail contato.barbosa@outlook.com.
          </li>
          <li>
            <strong>Encarregado pelo tratamento de dados (DPO):</strong> Gustavo Ariel Barbosa, e-mail contato.barbosa@outlook.com.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Dados que tratamos">
        <ul>
          <li>
            <strong>Conta:</strong> nome, e-mail, senha (armazenada apenas como
            hash bcrypt) e o registro do seu consentimento (versão e data).
          </li>
          <li>
            <strong>Sessões:</strong> títulos, mensagens, relatórios de
            conformidade gerados, nomes dos arquivos enviados e o texto extraído
            deles (até 50 mil caracteres por sessão). Os arquivos originais não
            são armazenados.
          </li>
          <li>
            <strong>Sessões sem conta:</strong> além do conteúdo acima, a versão
            e a data do consentimento dado neste navegador.
          </li>
          <li>
            <strong>Cookies essenciais:</strong> <code>auth_token</code> (login)
            e <code>session_token</code> (identifica as sessões sem conta deste
            navegador). Não usamos cookies de publicidade nem de análise.
          </li>
          <li>
            <strong>Registros técnicos:</strong> logs de acesso com método,
            caminho, status e horário da requisição, sem endereço IP, e logs de
            erro. O endereço IP é usado apenas em memória para limitar o número
            de requisições e não é gravado.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalidades e bases legais (art. 7º)">
        <ul>
          <li>
            Responder às suas perguntas e gerar relatórios de conformidade a
            partir das mensagens e documentos: <strong>consentimento</strong>{" "}
            (art. 7º, I).
          </li>
          <li>
            Criar e manter sua conta e suas sessões salvas:{" "}
            <strong>execução de contrato</strong> (art. 7º, V), conforme os{" "}
            <Link href="/termos" className="text-primary-600 underline">
              Termos de uso
            </Link>
            .
          </li>
          <li>
            Segurança, prevenção de abuso e diagnóstico de erros (limites de
            requisições e logs técnicos): <strong>legítimo interesse</strong>{" "}
            (art. 7º, IX).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Compartilhamento e transferência internacional (art. 33)">
        <p>
          Para gerar as respostas, cada mensagem é enviada à{" "}
          <strong>Anthropic, PBC</strong> (Estados Unidos), que atua como
          operadora, junto com o histórico da sessão e o texto de todos os
          documentos dela. Essa transferência internacional se baseia no seu{" "}
          <strong>consentimento específico e em destaque</strong> (art. 33,
          VIII), dado ao criar a conta ou a primeira sessão. A Anthropic retém
          esses dados conforme seus termos comerciais: 30 dias após a sessão, se não for deletada.
        </p>
        <p>
          Também usamos provedores de infraestrutura como operadores: Render Services, Inc. (hospedagem da API, EUA), MongoDB, Inc. (banco de dados, hospedado em São Paulo) e Vercel Inc. (hospedagem do site, EUA).
        </p>
      </LegalSection>

      <LegalSection title="5. Por quanto tempo guardamos">
        <ul>
          <li>
            <strong>Sessões sem conta:</strong> apagadas automaticamente 72
            horas após a criação, com mensagens e documentos.
          </li>
          <li>
            <strong>Sessões com conta:</strong> mantidas até você excluí-las ou
            excluir a conta. Ao entrar ou criar uma conta, as sessões sem conta
            deste navegador passam a ser da conta.
          </li>
          <li>
            <strong>Conta:</strong> até você excluí-la. A exclusão apaga
            imediatamente a conta, todas as sessões, mensagens, relatórios e
            documentos.
          </li>
          <li>
            <strong>Logs técnicos:</strong> mantidos pelo provedor de
            hospedagem por até 30 dias e depois apagados automaticamente.
          </li>
          <li>
            <strong>Cópias de segurança (backups):</strong> não mantemos
            cópias de segurança do banco de dados; dados excluídos são apagados
            de forma definitiva.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Seus direitos (art. 18) e como exercê-los">
        <p>
          Você pode, a qualquer momento: confirmar a existência de tratamento;
          acessar seus dados; corrigir dados incompletos, inexatos ou
          desatualizados; pedir anonimização, bloqueio ou eliminação de dados
          desnecessários ou excessivos; pedir a portabilidade; pedir a
          eliminação dos dados tratados com base no consentimento; saber com
          quem compartilhamos seus dados; ser informado sobre a possibilidade
          de não consentir e suas consequências; e revogar o consentimento.
        </p>
        <p>Diretamente no aplicativo:</p>
        <ul>
          <li>
            <strong>Acesso e portabilidade:</strong> menu da conta → &quot;Baixar
            meus dados&quot; (arquivo JSON com perfil, consentimento, sessões,
            mensagens, relatórios e texto dos documentos).
          </li>
          <li>
            <strong>Correção:</strong> menu da conta → &quot;Editar
            perfil&quot;.
          </li>
          <li>
            <strong>Eliminação:</strong> excluir uma sessão ou um arquivo na
            barra lateral, ou excluir a conta inteira em menu da conta →
            &quot;Excluir conta&quot;.
          </li>
          <li>
            <strong>Sem conta:</strong> exclua as sessões na barra lateral; de
            qualquer forma, elas são apagadas após 72 horas.
          </li>
        </ul>
        <p>
          Outros pedidos podem ser feitos ao encarregado pelo e-mail contato.barbosa@outlook.com. Você também pode peticionar à Autoridade Nacional de
          Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="7. Revogação do consentimento">
        <p>
          O serviço depende do envio das mensagens à Anthropic, por isso não é
          possível usá-lo sem consentimento. Para quem tem conta, revogar o
          consentimento equivale a <strong>excluir a conta</strong>, o que
          apaga todos os seus dados. Sem conta, basta excluir suas sessões. A
          revogação não afeta tratamentos já realizados (art. 8º, § 5º).
        </p>
      </LegalSection>

      <LegalSection title="8. Dados sensíveis e dados de terceiros">
        <p>
          Não envie dados pessoais sensíveis (art. 11: saúde, biometria,
          genética, origem racial ou étnica, convicção religiosa, opinião
          política, filiação sindical, vida sexual) nem dados pessoais de
          terceiros, como clientes, pacientes ou funcionários. Descreva seus
          processos de forma anonimizada. Se precisar analisar um documento,
          remova esses dados antes do envio.
        </p>
      </LegalSection>

      <LegalSection title="9. Idade mínima">
        <p>
          O LGPDei é destinado a maiores de 18 anos. Ao aceitar esta política,
          você declara ter 18 anos ou mais.
        </p>
      </LegalSection>

      <LegalSection title="10. Segurança">
        <p>
          Usamos cookies HttpOnly, senhas com hash bcrypt, tokens de login que
          são revogados ao sair, ao trocar o e-mail e ao excluir a conta,
          controle de acesso por sessão, limites de requisições e conexão
          criptografada (HTTPS) em produção.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações">
        <p>
          Quando esta política ou os termos mudarem de forma relevante,
          atualizaremos a data acima e pediremos um novo consentimento.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
