export function AnimatedBackground(): JSX.Element {
  return (
    <div className="home-animated-bg-wrap" aria-hidden>
      <div className="home-animated-bg-gradient" />
      <div className="home-animated-bg-orb home-animated-bg-orb--a" />
      <div className="home-animated-bg-orb home-animated-bg-orb--b" />
      <div className="home-animated-bg-orb home-animated-bg-orb--c" />
    </div>
  );
}
