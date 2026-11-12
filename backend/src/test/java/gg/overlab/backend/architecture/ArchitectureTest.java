package gg.overlab.backend.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.GeneralCodingRules;

@AnalyzeClasses(packages = "gg.overlab.backend", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule controllersDoNotTouchRepositories = noClasses()
            .that().haveSimpleNameEndingWith("Controller")
            .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository");

    @ArchTest
    static final ArchRule servicesDoNotDependOnControllers = noClasses()
            .that().haveSimpleNameEndingWith("Service")
            .should().dependOnClassesThat().haveSimpleNameEndingWith("Controller");

    @ArchTest
    static final ArchRule entitiesDoNotDependOnServicesOrControllers = noClasses()
            .that().areAnnotatedWith(jakarta.persistence.Entity.class)
            .should().dependOnClassesThat().haveSimpleNameEndingWith("Service")
            .orShould().dependOnClassesThat().haveSimpleNameEndingWith("Controller");

    @ArchTest
    static final ArchRule restControllersLiveInControllerClasses = classes()
            .that().areAnnotatedWith(org.springframework.web.bind.annotation.RestController.class)
            .should().haveSimpleNameEndingWith("Controller");

    @ArchTest
    static final ArchRule nothingOutsideCollectorDependsOnIt = noClasses()
            .that().resideOutsideOfPackage("gg.overlab.backend.collector..")
            .should().dependOnClassesThat().resideInAPackage("gg.overlab.backend.collector..");

    @ArchTest
    static final ArchRule configAndExceptionsDoNotDependOnDomains = noClasses()
            .that().resideInAnyPackage("gg.overlab.backend.config..", "gg.overlab.backend.exception..")
            .should().dependOnClassesThat().resideInAnyPackage("gg.overlab.backend.audit..",
                    "gg.overlab.backend.collector..", "gg.overlab.backend.feedback..", "gg.overlab.backend.gamemap..",
                    "gg.overlab.backend.guide..", "gg.overlab.backend.hero..", "gg.overlab.backend.notification..",
                    "gg.overlab.backend.patch..", "gg.overlab.backend.seo..", "gg.overlab.backend.stats..",
                    "gg.overlab.backend.user..");

    @ArchTest
    static final ArchRule seoReadsThroughServicesOnly = noClasses()
            .that().resideInAPackage("gg.overlab.backend.seo..")
            .should().dependOnClassesThat().haveSimpleNameEndingWith("Repository");

    @ArchTest
    static final ArchRule noFieldInjection = GeneralCodingRules.NO_CLASSES_SHOULD_USE_FIELD_INJECTION;

    @ArchTest
    static final ArchRule noStandardStreams = GeneralCodingRules.NO_CLASSES_SHOULD_ACCESS_STANDARD_STREAMS;

    @ArchTest
    static final ArchRule noJavaUtilLogging = GeneralCodingRules.NO_CLASSES_SHOULD_USE_JAVA_UTIL_LOGGING;

    @ArchTest
    static final ArchRule topLevelPackagesAreFreeOfCycles = slices()
            .matching("gg.overlab.backend.(*)..")
            .should().beFreeOfCycles();
}
