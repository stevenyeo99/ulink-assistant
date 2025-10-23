import './LoadingSpinner.css';

const LoadingSpinner = ({ show }) => {

    if (!show) return null;

    return (
        <div className="spinner-overlay">
            <div className="spinner" />
        </div>
    )
};

export default LoadingSpinner;