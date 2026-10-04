import styles from './Button.module.css'

// variant: primary (pink) | secondary (lilac) | ghost (outline) | danger
export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      {...props}
    />
  )
}
