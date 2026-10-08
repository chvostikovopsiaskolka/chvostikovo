import { memo, useEffect, useRef } from "react";
import "./wandering-dog.css";

type Point = { x: number; y: number };
const interpolate = (a: number, b: number, t: number) => a + (b - a) * t;

// Inline SVG + native SVG transforms: no animation inside an external <img>,
// CSS motion paths, or browser-specific SVG transform-origin behaviour.
export const WanderingDog = memo(function WanderingDog() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const walker = layer?.querySelector<HTMLElement>(".hero-wandering-dog");
    const facing = layer?.querySelector<HTMLElement>(".hero-wandering-dog-facing");
    if (!layer || !walker || !facing) return;
    const joints = [
      [".rear-near", 670, 810, 1], [".rear-far", 640, 813, -1],
      [".front-near", 938, 821, -1], [".front-far", 871, 850, 1],
      [".tail", 655, 767, .6],
    ] as const;
    const parts = joints.map(([selector, x, y, phase]) => ({
      element: layer.querySelector<SVGElement>(selector), x, y, phase,
    }));
    let width = 0;
    let height = 0;
    let dogWidth = 0;
    let elapsed = 0;
    let legClock = 0;
    let duration = 12000;
    let start: Point = { x: .46, y: .5 };
    let end: Point = { x: .82, y: .24 };
    let control: Point = { x: .7, y: .48 };
    let direction = 1;
    let timer: ReturnType<typeof setInterval> | undefined;
    let last = performance.now();

    function measure() {
      width = layer!.clientWidth;
      height = layer!.clientHeight;
      dogWidth = walker!.offsetWidth;
    }
    function draw(delta: number) {
      if (!width || !height) measure();
      if (!width || !height) return;
      elapsed += delta;
      legClock += delta;
      if (elapsed >= duration) {
        start = end;
        // Alternate horizontal and vertical destinations; diagonal journeys
        // naturally arise from independently sampled coordinates.
        const vertical = Math.random() < .5;
        end = vertical
          ? { x: .08 + Math.random() * .84, y: start.y > .54 ? .2 : .9 }
          : { x: start.x > .5 ? .03 : .94, y: .23 + Math.random() * .65 };
        control = {
          x: (start.x + end.x) / 2 + (Math.random() - .5) * .12,
          y: (start.y + end.y) / 2 + (Math.random() - .5) * .12,
        };
        duration = Math.max(6000, Math.hypot((end.x - start.x) * width, (end.y - start.y) * height) / (width < 640 ? 22 : 32) * 1000);
        elapsed = 0;
      }
      const t = Math.min(1, elapsed / duration);
      const u = 1 - t;
      const x = u * u * start.x + 2 * u * t * control.x + t * t * end.x;
      const y = u * u * start.y + 2 * u * t * control.y + t * t * end.y;
      const dx = interpolate(control.x - start.x, end.x - control.x, t);
      if (Math.abs(dx) > .005) direction = dx > 0 ? 1 : -1;
      const px = Math.max(4, Math.min(width - dogWidth - 4, x * (width - dogWidth)));
      const py = Math.max(72, Math.min(height - dogWidth * .51 - 4, y * (height - dogWidth * .51)));
      walker!.style.transform = `translate(${px.toFixed(2)}px, ${py.toFixed(2)}px)`;
      facing!.style.transform = `scaleX(${direction})`;
      const stride = Math.sin(legClock / 180) * 5;
      for (const part of parts) {
        const angle = part.phase === .6 ? Math.sin(legClock / 240) * 3 : stride * part.phase;
        part.element?.setAttribute("transform", `rotate(${angle.toFixed(2)} ${part.x} ${part.y})`);
      }
    }
    function stop() {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
    }
    function resume() {
      stop();
      measure();
      draw(0);
      last = performance.now();
      if (document.hidden) return;
      // Same timer approach as the working footprints, including mobile
      // WebViews. Capped deltas avoid a jump after backgrounding the app.
      timer = setInterval(() => {
        const now = performance.now();
        draw(Math.min(100, Math.max(0, now - last)));
        last = now;
      }, 40);
    }
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => { measure(); draw(0); });
    resize?.observe(layer);
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", resume);
    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", resume);
    resume();
    return () => {
      stop();
      resize?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  return (
    <div ref={layerRef} className="hero-wandering-dog-layer" aria-hidden="true">
      <div className="hero-wandering-dog">
        <div className="hero-wandering-dog-facing">
          <svg className="hero-wandering-dog-art" viewBox="470 670 670 340" fill="none" stroke="#EF8744" strokeWidth="4.3" strokeLinecap="round" strokeLinejoin="round">

<g className="leg rear-far" fill="white">
<path d="M651 777C630 799 625 819 615 837C602 862 581 883 559 892C555 894 552 901 548 911L525 966C519 979 526 984 540 984H558C563 975 555 968 546 967C552 949 559 930 571 918C593 898 625 892 649 876C662 867 672 857 677 844Z"/>
<path d="M548 974Q552 977 551 983"/>
</g>
<g className="leg front-far" fill="white">
<path d="M858 847L839 942Q833 954 838 958L846 978Q848 986 858 986H886Q892 978 878 971L867 969Q856 966 859 950C866 914 880 879 895 850Z"/>
<path d="M874 978Q880 981 879 985"/>
</g>
<path className="tail" d="M656 766C610 789 585 798 551 793C514 789 495 770 487 744C508 767 531 779 560 780C593 783 620 766 687 739" fill="white"/>
<path d="M651 778C655 751 683 739 713 732C747 723 779 732 805 737C846 744 871 740 891 737L907 736C923 738 968 715 990 699C1002 683 1021 681 1040 687C1057 690 1068 696 1071 706C1074 715 1095 721 1114 729C1122 731 1122 736 1116 743C1108 755 1090 757 1074 753C1054 749 1034 746 1018 755C992 765 973 783 955 806C961 822 954 842 952 852L917 867L905 851C858 860 826 851 798 832C773 814 754 792 731 802L687 847C661 827 641 803 651 778Z" fill="white"/>
<g className="leg rear-near" fill="white">
<path d="M661 758C640 780 648 808 668 836C690 861 689 882 677 906L665 922Q659 929 668 939L697 973Q703 985 716 985H741Q748 982 739 974Q732 970 721 970Q714 970 710 964L699 950C687 934 690 923 700 909C719 884 741 861 737 836C736 819 724 800 734 780"/>
<path d="M726 978Q733 981 733 985"/>
</g>
<g className="leg front-near" fill="white">
<path d="M946 786C962 805 959 824 953 848Q949 860 956 871C979 902 1007 934 1034 955Q1048 967 1059 968Q1073 970 1076 980Q1079 987 1067 987H1048Q1038 986 1030 976L1014 958Q1009 958 1004 951C981 925 951 902 919 881Q912 878 912 869C908 848 900 828 889 811"/>
<path d="M1057 976Q1067 978 1067 984"/>
</g>
<path d="M994 697C990 710 975 723 975 734Q974 744 984 754C990 761 991 774 1001 773C1015 771 1018 745 1019 726Q1018 709 1025 700" fill="white"/>
<path d="M1048 711Q1054 704 1061 708L1063 716Q1057 719 1048 711Z" fill="#EF8744" strokeWidth="2"/>
<path d="M1110 728Q1124 730 1119 736L1113 743Q1102 739 1104 733Q1105 730 1110 728Z" fill="#EF8744" stroke="none"/>
<path d="M1114 744Q1103 760 1069 751L1059 748"/>
</svg>

        </div>
      </div>
    </div>
  );
});
