type IconButtonProps = {
  icon: string;
  text: string;
  onClick: () => void;
};

function IconButton(prop: IconButtonProps) {
  return (
    <button onClick={prop.onClick}>
      <img src={prop.icon} alt="" />
      <span>{prop.text}</span>
    </button>
  );
}

export default IconButton;