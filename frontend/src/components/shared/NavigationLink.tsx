import { Link } from "react-router-dom";

type Props = {
  to: string;
  bg: string;
  text: string;
  textColor: string;
  onClick?: () => Promise<void>;
  fontSize?: string;
  padding?: string;
};
const NavigationLink = (props: Props) => {
  return (
    <Link
      onClick={props.onClick}
      className="nav-link"
      to={props.to}
      style={{
        background: props.bg,
        color: props.textColor,
        fontSize: props.fontSize,
        padding: props.padding,
      }}
    >
      {props.text}
    </Link>
  );
};

export default NavigationLink;
