import type { PageSection } from '@/components/admin/PageBuilder';
import { documentUrl } from '@/lib/documentDownload';
import styles from './DocumentDownload.module.css';

/** A CMS module for sharing an existing document, without copying its prices. */
export default function DocumentDownload({ data }: { data: PageSection }) {
    const file = documentUrl(data.buttonLink);
    const preview = documentUrl(data.image);
    const Heading = data.isPrimaryHeading === false ? 'h2' : 'h1';
    return <section className={`${styles.section} ${data.sectionTone === 'paper' ? styles.paper : ''}`}>
        <div className={styles.grid}>
            <div className={styles.copy}>
                {data.tag && <p className={styles.eyebrow}>{data.tag}</p>}
                <Heading className={styles.title}>{data.title}</Heading>
                {data.subtitle && <p className={styles.subtitle}>{data.subtitle}</p>}
                {data.description && <p className={styles.description}>{data.description}</p>}
                {file && data.buttonText && <a href={file} download className={styles.download} data-analytics="document-download">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg>
                    {data.buttonText}
                </a>}
                {data.content && <p className={styles.details}>{data.content}</p>}
            </div>
            {preview && <figure className={styles.preview}>
                <img src={preview} alt={data.imageAlt || ''} width="1061" height="1500" />
                {data.label && <figcaption>{data.label}</figcaption>}
            </figure>}
        </div>
    </section>;
}
