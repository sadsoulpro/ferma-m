import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import { GiHoneycomb } from "react-icons/gi";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate("/")} 
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <FaChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <GiHoneycomb className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Ферма Медовик
            </span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Политика конфиденциальности
        </h1>

        <div className="prose prose-sm md:prose-base max-w-none text-foreground/80 space-y-6">
          <p className="text-muted-foreground text-sm">
            Дата последнего обновления: 26 января 2026 г.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Общие положения</h2>
            <p>
              Настоящая Политика конфиденциальности (далее — «Политика») разработана в соответствии с 
              Законом Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите» 
              и определяет порядок обработки персональных данных пользователей интернет-магазина 
              «Ферма Медовик» (далее — «Оператор»), расположенного по адресу: 
              <a href="http://fermamedovik.kz" className="text-primary hover:underline"> fermamedovik.kz</a>.
            </p>
            <p>
              Использование интернет-магазина означает безоговорочное согласие пользователя с настоящей 
              Политикой и указанными в ней условиями обработки его персональных данных.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Персональные данные, которые мы собираем</h2>
            <p>При оформлении заказа мы собираем следующие персональные данные:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Имя (как вы представились)</li>
              <li>Номер телефона для связи</li>
              <li>Информация о заказе (состав, сумма)</li>
              <li>Использованный промокод (при наличии)</li>
            </ul>
            <p className="mt-3">
              Мы <strong>не собираем</strong> и не храним данные банковских карт, паспортные данные, 
              адреса электронной почты или иную конфиденциальную информацию.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Цели сбора и обработки данных</h2>
            <p>Персональные данные собираются и обрабатываются исключительно для:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Обработки и выполнения заказов</li>
              <li>Связи с покупателем для уточнения деталей заказа</li>
              <li>Доставки товаров</li>
              <li>Улучшения качества обслуживания</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Правовые основания обработки</h2>
            <p>
              Обработка персональных данных осуществляется на основании согласия субъекта персональных 
              данных, выраженного путём оформления заказа через интернет-магазин, в соответствии со 
              статьёй 7 Закона РК «О персональных данных и их защите».
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Хранение и защита данных</h2>
            <p>
              Оператор принимает необходимые организационные и технические меры для защиты персональных 
              данных от неправомерного или случайного доступа, уничтожения, изменения, блокирования, 
              копирования, распространения, а также от иных неправомерных действий третьих лиц.
            </p>
            <p>
              Персональные данные хранятся на защищённых серверах и доступны только уполномоченным 
              сотрудникам Оператора.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Передача данных третьим лицам</h2>
            <p>
              Оператор не передаёт персональные данные третьим лицам, за исключением случаев, 
              предусмотренных законодательством Республики Казахстан:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>По запросу уполномоченных государственных органов</li>
              <li>Для защиты прав и законных интересов Оператора</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Права субъекта персональных данных</h2>
            <p>В соответствии с законодательством РК вы имеете право:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Знать о наличии у Оператора своих персональных данных</li>
              <li>Получить информацию о своих персональных данных</li>
              <li>Требовать изменения или уничтожения своих персональных данных</li>
              <li>Отозвать согласие на обработку персональных данных</li>
            </ul>
            <p className="mt-3">
              Для реализации указанных прав вы можете связаться с нами через WhatsApp: 
              <a href="https://wa.me/77083214571" className="text-primary hover:underline"> +7 708 321 45 71</a> 
              или Telegram: <a href="https://t.me/fermamedovik" className="text-primary hover:underline">@fermamedovik</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Срок хранения данных</h2>
            <p>
              Персональные данные хранятся в течение срока, необходимого для достижения целей их 
              обработки, но не более 3 (трёх) лет с момента последнего взаимодействия с пользователем, 
              если иное не предусмотрено законодательством РК.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Изменение Политики</h2>
            <p>
              Оператор оставляет за собой право вносить изменения в настоящую Политику. 
              Актуальная версия Политики размещена на данной странице. При внесении существенных 
              изменений дата обновления будет изменена.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Контактная информация</h2>
            <p>
              <strong>Оператор:</strong> Интернет-магазин «Ферма Медовик»<br />
              <strong>Сайт:</strong> <a href="http://fermamedovik.kz" className="text-primary hover:underline">fermamedovik.kz</a><br />
              <strong>WhatsApp:</strong> <a href="https://wa.me/77083214571" className="text-primary hover:underline">+7 708 321 45 71</a><br />
              <strong>Telegram:</strong> <a href="https://t.me/fermamedovik" className="text-primary hover:underline">@fermamedovik</a>
            </p>
          </section>

          <section className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Настоящая Политика конфиденциальности разработана в соответствии с требованиями 
              Закона Республики Казахстан от 21 мая 2013 года № 94-V «О персональных данных и их защите».
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary/30 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026 Ферма Медовик. Все права защищены.
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPage;
