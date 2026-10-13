import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Termos de uso — LGPDei",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" updatedAt="13 de outubro de 2026">
      <p>
        Estes termos regem o uso do LGPDei, oferecido por [NOME DO
        CONTROLADOR], [CPF/CNPJ DO CONTROLADOR]. Ao criar uma conta ou iniciar
        uma sessão, você concorda com eles e com a{" "}
        <Link href="/privacidade" className="text-primary-600 underline">
          Política de privacidade
        </Link>
        .
      </p>

      <LegalSection title="1. O que é o LGPDei">
        <p>
          Uma ferramenta educativa, baseada em inteligência artificial
          (Anthropic Claude), que explica a LGPD e aponta possíveis lacunas de
          conformidade. <strong>Não é assessoria jurídica</strong> e não
          substitui a análise de um profissional. As respostas podem conter
          erros ou omissões; confira as referências legais antes de agir.
        </p>
      </LegalSection>

      <LegalSection title="2. Quem pode usar">
        <p>
          Apenas maiores de 18 anos. Você pode usar sem conta (as sessões são
          apagadas após 72 horas) ou criar uma conta para mantê-las até
          excluí-las.
        </p>
      </LegalSection>

      <LegalSection title="3. Sua conta">
        <p>
          Mantenha sua senha em sigilo. Você pode editar seu perfil, baixar
          seus dados e excluir sua conta a qualquer momento pelo menu da conta.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso aceitável">
        <ul>
          <li>
            Não envie dados pessoais sensíveis nem dados pessoais de terceiros;
            anonimize os documentos antes do envio.
          </li>
          <li>
            Envie apenas conteúdo que você tem o direito de compartilhar.
          </li>
          <li>
            Não use o serviço para fins ilícitos, nem tente contornar limites de
            uso, acessar dados de outros usuários ou prejudicar o
            funcionamento do sistema.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Limites de uso">
        <p>
          Há limites por hora de sessões, mensagens e envio de arquivos, e de
          tamanho e quantidade de arquivos por sessão. Eles podem mudar para
          manter o serviço disponível.
        </p>
      </LegalSection>

      <LegalSection title="6. Conteúdo">
        <p>
          Você continua titular do conteúdo que envia e nos autoriza a
          processá-lo somente para prestar o serviço, conforme a Política de
          privacidade.
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilidade">
        <p>
          O serviço é oferecido no estado em que se encontra. Decisões tomadas
          com base nas respostas são de sua responsabilidade, nos limites
          permitidos pela legislação brasileira, inclusive o Código de Defesa
          do Consumidor quando aplicável.
        </p>
      </LegalSection>

      <LegalSection title="8. Encerramento">
        <p>
          Você pode excluir sua conta a qualquer momento. Podemos suspender
          contas que violem estes termos.
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações, lei aplicável e contato">
        <p>
          Mudanças relevantes serão informadas e exigirão novo aceite. Aplica-se
          a lei brasileira; fica eleito o foro de [FORO/COMARCA]. Contato:
          [E-MAIL DE CONTATO].
        </p>
      </LegalSection>
    </LegalPage>
  );
}
