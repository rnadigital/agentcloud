import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Build Single or Multi Agent LLM Chatbots',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Agentcloud is designed with the idea that building single or multi agent chatbots in your company should be easy and intuitive. We run a fork of the Microsoft Autogen project designed to scale as a SaaS with sockets.
      </>
    ),
  },
  {
    title: 'Bring your own LLM',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        You should have the ability to choose which LLM you want to run. Agent Cloud is designed with the vision that any agent can run any model. The platform is modular enough to hit any locally hosted LLM client endpoint that returns an Open AI compatible response.
      </>
    ),
  },
  {
    title: 'RAG or query 300+ data sources',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        We use airbyte and rabbit MQ under the hood to enable customers to retrieve data from over 300 sources. We believe being an open source project and being self hostable is critical to companies wanting to self host their own company wide LLM Apps.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
